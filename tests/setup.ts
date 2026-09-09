// Loads .env.local so the RLS integration test can find its test accounts.
// process.loadEnvFile is built into Node (>= 20.12), so this needs no dependency.
// Missing file is fine: the integration test skips itself when the vars are absent.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — unit tests still run
}
