import "dotenv/config";

import {
  planRehomeRun,
  rehomeStoredFiles,
} from "@/modules/media/server/rehome";

function confirmed(argv: string[] = process.argv): boolean {
  return argv.includes("--yes");
}

/**
 * Moves every stored file to the active driver, one at a time, verifying each
 * copy before its record flips. It changes no key, revision or canonical
 * address, so a page keeps serving throughout; an interrupted run resumes
 * with the files it already moved.
 *
 * The preflight prints the space the copy needs. A warning-level plan (the
 * copies fit, the headroom does not) needs `--yes`; a plan with too little
 * disk is refused. Objects left on a provider are journaled for the purge
 * command, never removed here.
 */
async function main() {
  const plan = await planRehomeRun();

  console.log(`target: ${plan.target}`);
  console.log(`files: ${plan.files}`);
  console.log(`bytes: ${plan.bytes}`);
  console.log(`unknown sizes: ${plan.unknownFiles}`);
  console.log(`required: ${plan.requiredBytes}`);
  console.log(
    `available: ${plan.availableBytes === null ? "not applicable" : plan.availableBytes}`,
  );
  console.log(`level: ${plan.level}`);

  if (plan.level === "refused") {
    console.error(
      plan.blockedReason === "target-unconfigured"
        ? `The active storage driver "${plan.target}" is not configured on this instance.`
        : "The volume cannot hold the copies this move needs. Free the disk or delete files first.",
    );
    process.exitCode = 1;
    return;
  }

  if (plan.level === "warning" && !confirmed()) {
    console.error(
      plan.unknownFiles > 0
        ? `${plan.unknownFiles} files record no size, so the estimate is incomplete. Re-run with --yes to confirm anyway.`
        : "The copies fit, but the move's headroom does not. Re-run with --yes to confirm.",
    );
    process.exitCode = 1;
    return;
  }

  const report = await rehomeStoredFiles({
    plan,
    confirmed: true,
    onProgress: (progress) =>
      console.log(
        `${progress.status} ${progress.fileId}${
          progress.reason ? ` ${progress.reason}` : ""
        }`,
      ),
  });

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
