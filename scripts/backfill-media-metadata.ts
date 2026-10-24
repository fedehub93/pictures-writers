import "dotenv/config";

import { backfillMediaMetadata } from "@/modules/media/server/backfill-media-metadata";
import { getStorageDriver } from "@/modules/media/server/storage";

import { backfillConcurrency, backfillDryRun } from "./lib/backfill-cli";

async function main() {
  const report = await backfillMediaMetadata({
    driver: getStorageDriver(),
    concurrency: backfillConcurrency("MEDIA_BACKFILL_CONCURRENCY", 4),
    dryRun: backfillDryRun(),
    onProgress: (line) => console.log(line),
  });

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
