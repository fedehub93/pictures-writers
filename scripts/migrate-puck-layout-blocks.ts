import "dotenv/config";

import { migrateLayoutBlockDocuments } from "@/puck/migrations/migrate-layout-block-documents";

/**
 * One-off developer utility: rewrite stored Flex and Grid nodes to a Container,
 * writing the display mode they rendered with into the document first.
 *
 * Usage:
 *   npm run puck:migrate-layout-blocks:dry-run
 *   npm run puck:migrate-layout-blocks
 *
 * Run the applying command before deploying the change that deletes the two
 * block types: the current code still renders a Container correctly, while a
 * deploy first would leave published pages showing a not-found box.
 *
 * Both commands read whichever `DATABASE_URL` the loaded environment provides.
 * The dry run writes nothing and prints the report; it lives in its own npm
 * script because npm consumes a `--dry-run` argument passed after `--` itself.
 */
async function main() {
  const dryRun =
    process.argv.includes("--dry-run") ||
    process.env.PUCK_LAYOUT_BLOCKS_DRY_RUN === "1";
  const report = await migrateLayoutBlockDocuments({
    dryRun,
    onProgress: (line) => console.log(line),
  });

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
