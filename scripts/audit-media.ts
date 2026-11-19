import "dotenv/config";

import {
  auditMediaLibrary,
  formatMediaAuditReport,
  mediaAuditExitCode,
} from "@/modules/media/server/media-audit";

/**
 * Read-only: prints the library's driver mix, the Media that do not resolve
 * through their recorded driver, the local volume against the accounted bytes
 * and the unconfigured drivers. Exits non-zero when anything is unresolved.
 */
async function main() {
  const report = await auditMediaLibrary();

  for (const line of formatMediaAuditReport(report)) console.log(line);

  process.exitCode = mediaAuditExitCode(report);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
