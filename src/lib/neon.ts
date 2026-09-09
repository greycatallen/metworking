import { createClient } from "@neondatabase/neon-js";

import { env } from "@/lib/env";

/**
 * Browser client for Managed Better Auth + the Neon Data API.
 *
 * Built with the two-URL object form so the auth and data endpoints come from
 * the two documented public environment variables. The SDK attaches the signed-in
 * user's JWT to every Data API request; Postgres reads its `sub` claim through
 * `auth.user_id()` and applies the RLS policies in db/migrations/0001_init.sql.
 *
 * Created lazily so importing this module never executes during server render.
 */
let client: ReturnType<typeof createClient> | null = null;

export function neon() {
  if (!client) {
    client = createClient({
      auth: { url: env.authUrl },
      dataApi: { url: env.dataApiUrl },
    });
  }
  return client;
}
