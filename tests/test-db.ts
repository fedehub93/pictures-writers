import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import "dotenv/config"; // load .env first (general app config, no override)
import { config as loadEnv, parse as parseEnv } from "dotenv";

const ENV_PATH = path.resolve(process.cwd(), ".env");
const TEST_ENV_PATH = path.resolve(process.cwd(), ".env.test");

/**
 * Vitest must run against a dedicated test database only.
 *
 * Vitest already loads `.env.test` (test mode) before any setup file runs, so
 * `process.env.DATABASE_URL` is the test URL already. To know whether the
 * test URL is different from the app database, the real dev/production
 * DATABASE_URL is read from disk from `.env` and compared. If `.env.test` is
 * missing, or its DATABASE_URL is identical to the one in `.env`, the suite
 * refuses to start. This guarantees that the destructive table cleanup used
 * by the tests can never run against the database the app uses.
 *
 * A dedicated Neon branch that reuses the same database name is fine: the URL
 * (host/project) is different, so it is not treated as the dev database.
 */
export function resolveTestDatabaseUrl(): string {
  if (!existsSync(TEST_ENV_PATH)) {
    throw new Error(
      `".env.test" is missing. Vitest runs only against a dedicated test database. ` +
        'Create ".env.test" containing ' +
        "DATABASE_URL=<connection string of a dedicated test database or Neon branch>. " +
        "The dev/production DATABASE_URL in .env is never used by tests.",
    );
  }

  const devUrl = parseEnv(readFileSync(ENV_PATH, "utf8")).DATABASE_URL;

  loadEnv({ path: TEST_ENV_PATH, override: true });

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined after loading .env.test");
  }

  if (devUrl && url === devUrl) {
    throw new Error(
      "DATABASE_URL in .env.test is identical to the DATABASE_URL in .env " +
        "(the dev/production database). Tests must run against a separate database " +
        "(e.g. a dedicated Neon branch). Refusing to run.",
    );
  }

  return url;
}