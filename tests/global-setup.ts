import { execSync } from "node:child_process";

import { resolveTestDatabaseUrl } from "./test-db";

export default function setup() {
  // Run migrations against the dedicated test database only.
  process.env.DATABASE_URL = resolveTestDatabaseUrl();

  // Advisory locking is disabled because the test runner may invoke this
  // setup repeatedly in quick succession.
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "true",
    },
  });
}