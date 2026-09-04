import { resolveTestDatabaseUrl } from "./test-db";

// Override the DATABASE_URL used by every worker (src/shared/lib/db.ts reads
// process.env.DATABASE_URL) with the dedicated test database from .env.test.
process.env.DATABASE_URL = resolveTestDatabaseUrl();