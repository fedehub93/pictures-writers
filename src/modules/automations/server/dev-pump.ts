import "server-only";

import { enqueueDueCronAutomations } from "../lib/automation-triggers";
import { pumpDueAutomations } from "./automation-runtime";

/**
 * Development-only pump.
 *
 * In production an external cron drives `POST /api/automations/run/`; in
 * development nothing does, so enqueued Runs sit `RUNNING` forever. This starts
 * a lightweight interpreter that evaluates cron triggers and drains due steps on
 * an interval, so manual/cron/webhook flows actually run locally.
 *
 * It is started from `src/instrumentation.ts` and only in development.
 */

const DEFAULT_INTERVAL_MS = 15_000;
const TIMER_KEY = "__picturesWritersAutomationDevPump";

type GlobalWithTimer = typeof globalThis & {
  [TIMER_KEY]?: ReturnType<typeof setInterval>;
};

export interface AutomationDevPumpOptions {
  /** Overrides the configured interval (test seam). */
  intervalMs?: number;
  /** Test seam: work performed on each tick; defaults to cron + drain. */
  run?: () => Promise<void>;
}

export function resolveDevPumpIntervalMs(): number {
  const raw = Number(process.env.AUTOMATIONS_DEV_PUMP_INTERVAL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_INTERVAL_MS;
}

async function defaultTick(): Promise<void> {
  await enqueueDueCronAutomations();
  await pumpDueAutomations();
}

export function startAutomationDevPump(
  options: AutomationDevPumpOptions = {},
): ReturnType<typeof setInterval> | null {
  const globalObject = globalThis as GlobalWithTimer;

  if (globalObject[TIMER_KEY]) {
    return null;
  }

  const run = options.run ?? defaultTick;
  const intervalMs = options.intervalMs ?? resolveDevPumpIntervalMs();

  const tick = () => {
    void run().catch((error) => {
      console.error("[automations:dev-pump]", error);
    });
  };

  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  globalObject[TIMER_KEY] = timer;
  tick();

  return timer;
}

export function stopAutomationDevPump(): void {
  const globalObject = globalThis as GlobalWithTimer;
  const timer = globalObject[TIMER_KEY];

  if (timer) {
    clearInterval(timer);
    delete globalObject[TIMER_KEY];
  }
}