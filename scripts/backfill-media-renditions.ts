import "dotenv/config";

import {
  backfillMediaRenditions,
  DEFAULT_RENDITION_BACKFILL_CONCURRENCY,
} from "@/modules/media/server/backfill-media-renditions";
import { resolveActiveStorageDriver } from "@/modules/media/server/storage";

import {
  backfillConcurrency,
  backfillDryRun,
  backfillExitCode,
} from "./lib/backfill-cli";

async function main() {
  const report = await backfillMediaRenditions({
    active: await resolveActiveStorageDriver(),
    concurrency: backfillConcurrency(
      "MEDIA_RENDITION_BACKFILL_CONCURRENCY",
      DEFAULT_RENDITION_BACKFILL_CONCURRENCY,
    ),
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
