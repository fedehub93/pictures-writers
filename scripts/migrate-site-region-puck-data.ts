import "dotenv/config";

import { migrateSiteRegionDocuments } from "@/modules/site-regions/server/migrate-site-region-documents";

/**
 * One-off developer utility: convert stored Site region documents from the old
 * flat Header/Footer block props to the nested `content` shapes.
 *
 * Usage:
 *   npm run site-regions:migrate-puck-data:dry-run
 *   npm run site-regions:migrate-puck-data
 *
 * The dry run writes nothing and prints the report. It lives in its own npm
 * script because npm consumes a `--dry-run` argument passed after `--` itself.
 */
async function main() {
  const dryRun =
    process.argv.includes("--dry-run") ||
    process.env.SITE_REGION_MIGRATION_DRY_RUN === "1";
  const report = await migrateSiteRegionDocuments({
    dryRun,
    onProgress: (line) => console.log(line),
  });

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
