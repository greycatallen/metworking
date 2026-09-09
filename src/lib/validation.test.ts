import { describe, expect, it } from "vitest";

import {
  isPriority,
  NAME_MAX_LENGTH,
  PRIORITIES,
  validateContact,
} from "@/lib/validation";

/**
 * These assert the client-side mirror of the database CHECK constraints in
 * db/migrations/0001_init.sql. The database is what actually enforces them;
 * these tests keep the two in agreement so users get a precise message instead
 * of a raw Postgres error.
 */

describe("isPriority", () => {
  it("accepts exactly the three allowed values", () => {
    expect(PRIORITIES).toEqual(["high", "medium", "low"]);
    for (const p of PRIORITIES) expect(isPriority(p)).toBe(true);
  });

  it("rejects anything else, including near misses", () => {
    for (const bad of ["urgent", "HIGH", "High", "", " high", null, 1, undefined]) {
      expect(isPriority(bad)).toBe(false);
    }
  });
});

describe("validateContact", () => {
  const valid = { name: "Dana Chen", priority: "high" };

  it("accepts a minimal valid contact", () => {
    const result = validateContact(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Dana Chen");
      expect(result.value.priority).toBe("high");
    }
  });

  it("rejects an empty name", () => {
    const result = validateContact({ ...valid, name: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBe("Name is required.");
  });

  it("rejects a whitespace-only name, matching contacts_name_not_blank", () => {
    const result = validateContact({ ...valid, name: "   \t " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBe("Name is required.");
  });

  it("rejects a missing name", () => {
    const result = validateContact({ priority: "low" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBeDefined();
  });

  it("rejects a name over the database length limit", () => {
    const result = validateContact({ ...valid, name: "x".repeat(NAME_MAX_LENGTH + 1) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toMatch(/200 characters or fewer/);
  });

  it("accepts a name exactly at the limit", () => {
    expect(validateContact({ ...valid, name: "x".repeat(NAME_MAX_LENGTH) }).ok).toBe(true);
  });

  it("rejects an invalid priority", () => {
    const result = validateContact({ ...valid, priority: "urgent" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.priority).toBe("Priority must be high, medium, or low.");
    }
  });

  it("rejects a priority with the wrong case rather than silently coercing", () => {
    expect(validateContact({ ...valid, priority: "HIGH" }).ok).toBe(false);
  });

  it("rejects a missing priority instead of defaulting", () => {
    expect(validateContact({ name: "Dana" }).ok).toBe(false);
  });

  it("reports every invalid field at once", () => {
    const result = validateContact({ name: "  ", priority: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.priority).toBeDefined();
    }
  });

  it("trims the name and optional fields", () => {
    const result = validateContact({
      name: "  Dana Chen  ",
      company: "  Anthropic ",
      priority: "medium",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Dana Chen");
      expect(result.value.company).toBe("Anthropic");
    }
  });

  it("normalises blank optional fields to null so the column stays empty", () => {
    const result = validateContact({ ...valid, company: "   ", notes: "" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.company).toBeNull();
      expect(result.value.notes).toBeNull();
      expect(result.value.role).toBeNull();
      expect(result.value.met_at).toBeNull();
    }
  });

  it("never returns a user_id: ownership is the database's job", () => {
    const result = validateContact({ ...valid, user_id: "someone-else" } as never);
    expect(result.ok).toBe(true);
    if (result.ok) expect("user_id" in result.value).toBe(false);
  });
});
