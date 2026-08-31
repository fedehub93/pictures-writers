import { execSync } from "node:child_process";
import "dotenv/config";

export default function setup() {
  // Ensure the test database (the one configured in .env) is migrated before
  // any test worker starts. Advisory locking is disabled because the test
  // runner may invoke this setup repeatedly in quick succession.
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "true",
    },
  });
}
