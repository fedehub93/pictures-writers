import "dotenv/config";

import { migrateSizeSpacingDocuments } from "@/puck/migrations/migrate-size-spacing-documents";

/**
 * One-off developer utility: convert stored Puck documents from the single
 * `dimension` prop to the split `size` and `spacing` props.
 *
 * Usage:
 *   npm run puck:migrate-size-spacing:dry-run
 *   npm run puck:migrate-size-spacing
 *
 * Both read whichever `DATABASE_URL` the loaded environment provides. The dry
 * run writes nothing and prints the report; it lives in its own npm script
 * because npm consumes a `--dry-run` argument passed after `--` itself.
 */
async function main() {
  const dryRun =
    process.argv.includes("--dry-run") ||
    process.env.PUCK_SIZE_SPACING_DRY_RUN === "1";
  const report = await migrateSizeSpacingDocuments({
    dryRun,
    onProgress: (line) => console.log(line),
  });

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
