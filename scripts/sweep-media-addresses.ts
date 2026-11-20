import "dotenv/config";

import {
  addressSweepExitCode,
  formatAddressSweepReport,
  sweepStorageAddresses,
} from "@/modules/media/server/address-sweep";

function dryRun(argv: string[] = process.argv, env = process.env): boolean {
  return argv.includes("--dry-run") || env.MEDIA_SWEEP_DRY_RUN === "1";
}

/**
 * Rewrites every absolute provider address stored in content into the
 * canonical address of the file it points to. It changes no key, revision or
 * driver and moves no byte, so it is the step that lets a library be moved or
 * its provider retired without a rewrite of published content.
 *
 * The run is idempotent; a second run reports zero changes. `--dry-run` (or
 * `MEDIA_SWEEP_DRY_RUN=1`) reports what it would change without writing. An
 * address no stored file owns is reported by field and count, and exits
 * non-zero so the next storage step can be gated on it.
 */
async function main() {
  const report = await sweepStorageAddresses({
    dryRun: dryRun(),
  });

  for (const line of formatAddressSweepReport(report)) console.log(line);

  process.exitCode = addressSweepExitCode(report);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
