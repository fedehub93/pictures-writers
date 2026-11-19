export function backfillDryRun(
  argv: string[] = process.argv,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return argv.includes("--dry-run") || env.MEDIA_BACKFILL_DRY_RUN === "1";
}

export function backfillConcurrency(
  variable: string,
  fallback: number,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const configured = Number(env[variable] ?? fallback);

  return Number.isFinite(configured) && configured > 0
    ? configured
    : fallback;
}

export interface BackfillReportLike {
  failed: readonly unknown[];
}

/**
 * The process exit code for a finished backfill. A run that reported any
 * unprocessed Media fails, dry-run included: the metadata preview reads its
 * sources and the rendition preview resolves their drivers, so a deployment
 * gate can rely on the status instead of parsing the report.
 */
export function backfillExitCode(report: BackfillReportLike): number {
  return report.failed.length > 0 ? 1 : 0;
}
