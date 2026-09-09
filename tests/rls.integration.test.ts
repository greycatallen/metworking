import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Row Level Security isolation test — the two-account privacy proof.
 *
 * This talks to the real, public Neon Data API over HTTPS with real Better Auth
 * JWTs. It deliberately does NOT go through the app's own data layer: the point
 * is to attack the same endpoint the browser uses, the way an attacker would,
 * and confirm Postgres refuses. Anything that passed only because the UI never
 * sends it would be worthless as evidence.
 *
 * Skips itself when the test-account variables are absent, so `npm test` stays
 * green on a fresh clone with no credentials.
 */

const AUTH_URL = process.env.NEXT_PUBLIC_NEON_AUTH_URL;
const DATA_API_URL = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;
const A_EMAIL = process.env.TEST_USER_A_EMAIL;
const A_PASSWORD = process.env.TEST_USER_A_PASSWORD;
const B_EMAIL = process.env.TEST_USER_B_EMAIL;
const B_PASSWORD = process.env.TEST_USER_B_PASSWORD;

const configured = Boolean(
  AUTH_URL && DATA_API_URL && A_EMAIL && A_PASSWORD && B_EMAIL && B_PASSWORD,
);

// Better Auth checks Origin against the project's trusted domains.
const ORIGIN = "http://localhost:3000";

async function signIn(email: string, password: string): Promise<string> {
  const signInRes = await fetch(`${AUTH_URL}/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ email, password }),
  });
  if (!signInRes.ok) {
    throw new Error(`sign-in failed for ${email}: HTTP ${signInRes.status}`);
  }

  const cookie = signInRes.headers.getSetCookie().join("; ");
  const sessionRes = await fetch(`${AUTH_URL}/get-session`, {
    headers: { Cookie: cookie, Origin: ORIGIN },
  });
  const jwt = sessionRes.headers.get("set-auth-jwt");
  if (!jwt) throw new Error(`no JWT issued for ${email}`);
  return jwt;
}

interface DbResponse {
  status: number;
  body: unknown;
}

/** Raw Data API call. `token` omitted means an unauthenticated request. */
async function db(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<DbResponse> {
  const { token, ...rest } = init;
  const res = await fetch(`${DATA_API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

interface Row {
  id: number;
  name: string;
  user_id: string;
  priority: string;
}

describe.skipIf(!configured)("contacts Row Level Security", () => {
  let tokenA: string;
  let tokenB: string;
  let subA: string;
  let subB: string;
  let rowOfA: Row;

  function subject(jwt: string): string {
    const payload = JSON.parse(
      Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"),
    );
    return payload.sub;
  }

  beforeAll(async () => {
    [tokenA, tokenB] = await Promise.all([
      signIn(A_EMAIL!, A_PASSWORD!),
      signIn(B_EMAIL!, B_PASSWORD!),
    ]);
    subA = subject(tokenA);
    subB = subject(tokenB);

    const created = await db("/contacts", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({
        name: `RLS probe ${Date.now()}`,
        company: "Private Co",
        priority: "high",
      }),
    });
    expect(created.status).toBe(201);
    rowOfA = (created.body as Row[])[0];
  }, 30_000);

  afterAll(async () => {
    if (rowOfA) {
      await db(`/contacts?id=eq.${rowOfA.id}`, {
        method: "DELETE",
        token: tokenA,
      });
    }
  }, 30_000);

  it("gives the two accounts different identities", () => {
    expect(subA).not.toBe(subB);
  });

  it("stamps user_id from the JWT, not from client input", () => {
    // The insert above never sent user_id; the column default did it.
    expect(rowOfA.user_id).toBe(subA);
  });

  it("lets User A read their own contact", async () => {
    const res = await db(`/contacts?id=eq.${rowOfA.id}&select=id,name`, {
      token: tokenA,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("hides User A's contact from User B", async () => {
    const res = await db("/contacts?select=id,name,user_id", { token: tokenB });
    expect(res.status).toBe(200);
    const ids = (res.body as Row[]).map((r) => r.id);
    expect(ids).not.toContain(rowOfA.id);
    // Nothing B can see belongs to anyone but B.
    for (const row of res.body as Row[]) expect(row.user_id).toBe(subB);
  });

  it("stops User B from updating User A's contact", async () => {
    const res = await db(`/contacts?id=eq.${rowOfA.id}`, {
      method: "PATCH",
      token: tokenB,
      body: JSON.stringify({ name: "HACKED" }),
    });
    // The row is invisible to B, so the UPDATE matches nothing.
    expect(res.body).toEqual([]);

    const check = await db(`/contacts?id=eq.${rowOfA.id}&select=name`, {
      token: tokenA,
    });
    expect((check.body as Row[])[0].name).toBe(rowOfA.name);
  });

  it("stops User B from deleting User A's contact", async () => {
    const res = await db(`/contacts?id=eq.${rowOfA.id}`, {
      method: "DELETE",
      token: tokenB,
    });
    expect(res.body).toEqual([]);

    const check = await db(`/contacts?id=eq.${rowOfA.id}&select=id`, {
      token: tokenA,
    });
    expect(check.body).toHaveLength(1);
  });

  it("stops User A from handing a row to User B (UPDATE WITH CHECK)", async () => {
    const res = await db(`/contacts?id=eq.${rowOfA.id}`, {
      method: "PATCH",
      token: tokenA,
      body: JSON.stringify({ user_id: subB }),
    });
    expect(res.status).toBe(403);
    expect((res.body as { code: string }).code).toBe("42501");

    const check = await db(`/contacts?id=eq.${rowOfA.id}&select=user_id`, {
      token: tokenA,
    });
    expect((check.body as Row[])[0].user_id).toBe(subA);
  });

  it("stops a user from inserting a row owned by someone else", async () => {
    const res = await db("/contacts", {
      method: "POST",
      token: tokenA,
      body: JSON.stringify({ name: "Planted", priority: "low", user_id: subB }),
    });
    expect(res.status).toBe(403);
    expect((res.body as { code: string }).code).toBe("42501");
  });

  it("refuses unauthenticated reads", async () => {
    const res = await db("/contacts?select=*");
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/authentication credentials/i);
  });
});

describe.skipIf(!configured)("contacts validation enforced by Postgres", () => {
  let token: string;

  beforeAll(async () => {
    token = await signIn(A_EMAIL!, A_PASSWORD!);
  }, 30_000);

  async function insert(body: Record<string, unknown>) {
    return db("/contacts", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    });
  }

  it("rejects an invalid priority even when sent straight to the API", async () => {
    const res = await insert({ name: "Bypass", priority: "urgent" });
    expect(res.status).toBe(400);
    const body = res.body as { code: string; message: string };
    expect(body.code).toBe("23514");
    expect(body.message).toContain("contacts_priority_valid");
  });

  it("rejects an empty name", async () => {
    const res = await insert({ name: "", priority: "low" });
    expect(res.status).toBe(400);
    expect((res.body as { message: string }).message).toContain(
      "contacts_name_not_blank",
    );
  });

  it("rejects a whitespace-only name", async () => {
    const res = await insert({ name: "   ", priority: "low" });
    expect(res.status).toBe(400);
    expect((res.body as { message: string }).message).toContain(
      "contacts_name_not_blank",
    );
  });

  it("rejects a name longer than the column allows", async () => {
    const res = await insert({ name: "x".repeat(201), priority: "low" });
    expect(res.status).toBe(400);
    expect((res.body as { message: string }).message).toContain(
      "contacts_name_max_len",
    );
  });

  it("refuses to let a client write the generated priority_rank column", async () => {
    const res = await insert({
      name: "Rank forger",
      priority: "low",
      priority_rank: 1,
    });
    expect(res.status).toBe(400);
    const body = res.body as { code: string; message: string; details: string };
    expect(body.code).toBe("428C9");
    expect(body.message).toContain("priority_rank");
    expect(body.details).toMatch(/generated column/i);
  });
});
