import { parseDurationValue } from "./duration";
import type { JsonObject } from "./graph";

/**
 * Pure scheduling helpers for the Cron trigger.
 *
 * A cron trigger defines an `interval` (number of ms, a human duration such as
 * `"2 days"`, or an object of unit fields) and an optional `timeOfDay`
 * (`"HH:mm"`, UTC). The trigger is due when that interval has elapsed since the
 * most recent Run of the Automation — read from the ledger by the evaluator.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type TimeOfDay = {
  hours: number;
  minutes: number;
};

export type CronSchedule = {
  intervalMs: number;
  timeOfDay: TimeOfDay | null;
};

export function parseTimeOfDay(value: unknown): TimeOfDay | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

export function parseCronSchedule(data: JsonObject): CronSchedule | null {
  const intervalMs = parseDurationValue(data.interval);

  if (intervalMs === null || intervalMs <= 0) {
    return null;
  }

  return {
    intervalMs,
    timeOfDay: parseTimeOfDay(data.timeOfDay),
  };
}

function startOfUtcDay(ms: number): number {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function alignToTimeOfDay(ms: number, timeOfDay: TimeOfDay): number {
  const offset =
    timeOfDay.hours * 60 * 60 * 1000 + timeOfDay.minutes * 60 * 1000;
  let candidate = startOfUtcDay(ms) + offset;

  if (candidate < ms) {
    candidate += DAY_MS;
  }

  return candidate;
}

/**
 * The instant the trigger becomes due, given the most recent Run's start. The
 * interval base is the last run; an automation that never ran is due
 * immediately.
 */
export function nextCronFireAt(
  schedule: CronSchedule,
  lastRunAt: Date | null,
): Date {
  const base = lastRunAt ? lastRunAt.getTime() : 0;
  let due = base + schedule.intervalMs;

  if (schedule.timeOfDay) {
    due = alignToTimeOfDay(due, schedule.timeOfDay);
  }

  return new Date(due);
}

export function isCronTriggerDue(
  data: JsonObject,
  lastRunAt: Date | null,
  now: Date,
): boolean {
  const schedule = parseCronSchedule(data);

  if (!schedule) {
    return false;
  }

  return now.getTime() >= nextCronFireAt(schedule, lastRunAt).getTime();
}
