/**
 * Next.js instrumentation hook.
 *
 * In development there is no external cron to pump the automation runtime, so
 * enqueued Runs never execute. Start a development-only pump instead; it is
 * disabled in production (where the cron-job.org job drives the endpoint) and
 * can be turned off with `AUTOMATIONS_DEV_PUMP=off`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (process.env.AUTOMATIONS_DEV_PUMP === "off") {
    return;
  }

  const { startAutomationDevPump } = await import(
    "./modules/automations/server/dev-pump"
  );
  startAutomationDevPump();
}