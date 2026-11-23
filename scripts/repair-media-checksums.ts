import "dotenv/config";

import {
  checksumRepairExitCode,
  DEFAULT_CHECKSUM_REPAIR_CONCURRENCY,
  formatChecksumRepairReport,
  repairMediaChecksums,
} from "@/modules/media/server/repair-checksums";
import { resolveActiveStorageDriver } from "@/modules/media/server/storage";

import { backfillConcurrency } from "./lib/backfill-cli";

function dryRun(
  argv: string[] = process.argv,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return argv.includes("--dry-run") || env.MEDIA_REPAIR_DRY_RUN === "1";
}

/**
 * One-off repair of `StoredFile.checksum`: every remote file is read again and
 * the record learns the sha256, size and content type of the bytes it owns.
 * `--dry-run` (or `MEDIA_REPAIR_DRY_RUN=1`) reads and reports without writing;
 * a file whose bytes cannot be read fails the command and is left alone.
 */
async function main() {
  const report = await repairMediaChecksums({
    active: await resolveActiveStorageDriver(),
    concurrency: backfillConcurrency(
      "MEDIA_CHECKSUM_REPAIR_CONCURRENCY",
      DEFAULT_CHECKSUM_REPAIR_CONCURRENCY,
    ),
    dryRun: dryRun(),
    onProgress: (line) => console.log(line),
  });

  for (const line of formatChecksumRepairReport(report)) console.log(line);

  process.exitCode = checksumRepairExitCode(report);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
