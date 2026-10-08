import "dotenv/config";

/**
 * One-time, idempotent backfill of the Page Root + Version schema from the
 * legacy `Page` table. Safe to re-run; it never mutates the legacy table.
 *
 * Usage: npm run backfill:pages
 */
async function main() {
  const { backfillPageRootVersion } = await import(
    "../src/modules/pages/server/backfill"
  );

  const result = await backfillPageRootVersion();

  console.log(
    `Page Root + Version backfill complete: ` +
      `${result.rootsProcessed} roots, ${result.versionsProcessed} versions.`,
  );
}

main().catch((error) => {
  console.error("Page Root + Version backfill failed:", error);
  process.exitCode = 1;
});
