import { db } from "@/shared/lib/db";

/**
 * Wipe all six automation tables between tests.
 *
 * Runs only against the dedicated test database (`.env.test`); the Vitest
 * setup guards this (see `tests/test-db.ts`). Order matters: children are
 * deleted before parents so no FK cascade is relied upon.
 */
export async function cleanupAutomationTables(): Promise<void> {
  await db.automationRunStep.deleteMany({});
  await db.automationRun.deleteMany({});
  await db.connection.deleteMany({});
  await db.node.deleteMany({});
  await db.credential.deleteMany({});
  await db.automation.deleteMany({});
}