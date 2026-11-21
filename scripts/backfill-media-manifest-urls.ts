import "dotenv/config";

import { backfillMediaManifestUrls } from "@/modules/media/server/backfill-manifest-urls";

import { backfillDryRun, backfillExitCode } from "./lib/backfill-cli";

/**
 * Copies every existing Media's rendition addresses out of its delivery token
 * and into the rendition manifest, so the token's column can be dropped
 * without a remote rendition losing the address delivery redirects to. It is
 * idempotent and writes no bytes and no address.
 */
async function main() {
  const report = await backfillMediaManifestUrls({
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
