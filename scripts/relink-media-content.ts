import "dotenv/config";

import {
  formatRelinkReport,
  relinkExitCode,
  relinkMediaContent,
} from "@/modules/media/server/relink-content";

function dryRun(argv: string[] = process.argv, env = process.env): boolean {
  return argv.includes("--dry-run") || env.MEDIA_RELINK_DRY_RUN === "1";
}

/**
 * The operator entry point for `relinkMediaContent`: `--dry-run` (or
 * `MEDIA_RELINK_DRY_RUN=1`) performs every read and comparison without
 * writing, and an address left unresolved fails the command.
 */
async function main() {
  const report = await relinkMediaContent({
    dryRun: dryRun(),
    onProgress: (line) => console.log(line),
  });

  for (const line of formatRelinkReport(report)) console.log(line);

  process.exitCode = relinkExitCode(report);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
