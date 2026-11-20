import "dotenv/config";

import { backfillStoredFiles } from "@/modules/media/server/backfill-stored-files";

import { backfillDryRun, backfillExitCode } from "./lib/backfill-cli";

/**
 * Gives every existing Media the StoredFile record that answers "where are the
 * bytes". Read-only with respect to Media: it creates the location records and
 * reports the rows it could not read, so it can run before any byte moves and
 * be repeated without creating duplicates.
 */
async function main() {
  const report = await backfillStoredFiles({
    dryRun: backfillDryRun(),
    onProgress: (line) => console.log(line),
  });

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = backfillExitCode(report);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
