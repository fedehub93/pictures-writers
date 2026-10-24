import "dotenv/config";

import { backfillMediaMetadata } from "@/modules/media/server/backfill-media-metadata";
import { getStorageDriver } from "@/modules/media/server/storage";

const dryRun =
  process.argv.includes("--dry-run") ||
  process.env.MEDIA_BACKFILL_DRY_RUN === "1";
const configuredConcurrency = Number(process.env.MEDIA_BACKFILL_CONCURRENCY ?? "4");
const concurrency =
  Number.isFinite(configuredConcurrency) && configuredConcurrency > 0
    ? configuredConcurrency
    : 4;

async function main() {
  const report = await backfillMediaMetadata({
    driver: getStorageDriver(),
    concurrency,
    dryRun,
    onProgress: (line) => console.log(line),
  });

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
