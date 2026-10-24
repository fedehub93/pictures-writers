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
