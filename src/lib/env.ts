/**
 * Public runtime configuration.
 *
 * Both values are inlined into the browser bundle by Next.js at build time.
 * That is intentional and safe: they are HTTPS endpoints, not credentials.
 * Every row reachable through them is protected by Row Level Security, and the
 * `anonymous` Postgres role holds no privileges on `contacts` at all.
 *
 * The Postgres connection string is deliberately absent from this file. It
 * bypasses RLS and must never be referenced from code that ships to the client.
 */

// Referenced as full literals so Next.js can statically replace them.
const NEON_AUTH_URL = process.env.NEXT_PUBLIC_NEON_AUTH_URL;
const NEON_DATA_API_URL = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in from your Neon project.`,
    );
  }
  return value;
}

export const env = {
  get authUrl() {
    return required(NEON_AUTH_URL, "NEXT_PUBLIC_NEON_AUTH_URL");
  },
  get dataApiUrl() {
    return required(NEON_DATA_API_URL, "NEXT_PUBLIC_NEON_DATA_API_URL");
  },
};
