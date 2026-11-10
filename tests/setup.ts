import { resolveTestDatabaseUrl } from "./test-db";

// Override the DATABASE_URL used by every worker (src/shared/lib/db.ts reads
// process.env.DATABASE_URL) with the dedicated test database from .env.test.
process.env.DATABASE_URL = resolveTestDatabaseUrl();

// React 19 only treats act() as a test-environment primitive when this flag is
// set. Without it every state update inside act() logs "The current testing
// environment is not configured to support act(...)", which hides the useful
// "update not wrapped in act" warning instead of surfacing it.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;