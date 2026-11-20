import "dotenv/config";

import { backfillMediaMetadata } from "@/modules/media/server/backfill-media-metadata";
import { resolveActiveStorageDriver } from "@/modules/media/server/storage";

import {
  backfillConcurrency,
  backfillDryRun,
  backfillExitCode,
} from "./lib/backfill-cli";

async function main() {
  const report = await backfillMediaMetadata({
    active: await resolveActiveStorageDriver(),
    concurrency: backfillConcurrency("MEDIA_BACKFILL_CONCURRENCY", 4),
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
