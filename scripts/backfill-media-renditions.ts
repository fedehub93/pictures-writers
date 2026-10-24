import "dotenv/config";

import {
  backfillMediaRenditions,
  DEFAULT_RENDITION_BACKFILL_CONCURRENCY,
} from "@/modules/media/server/backfill-media-renditions";
import { getStorageDriver } from "@/modules/media/server/storage";

import { backfillConcurrency, backfillDryRun } from "./lib/backfill-cli";

async function main() {
  const report = await backfillMediaRenditions({
    driver: getStorageDriver(),
    concurrency: backfillConcurrency(
      "MEDIA_RENDITION_BACKFILL_CONCURRENCY",
      DEFAULT_RENDITION_BACKFILL_CONCURRENCY,
    ),
    dryRun: backfillDryRun(),
    onProgress: (line) => console.log(line),
  });

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
