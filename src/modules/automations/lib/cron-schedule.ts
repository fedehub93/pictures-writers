import { parseDurationValue } from "./duration";
import type { JsonObject } from "./graph";
import {
  alignToTimeOfDay,
  DEFAULT_TIME_ZONE,
  parseTimeOfDay,
  type TimeOfDay,
} from "./time-zone";

/**
 * Pure scheduling helpers for the Cron trigger.
 *
 * A cron trigger defines an `interval` (number of ms, a human duration such as
 * `"2 days"`, or an object of unit fields) and an optional `timeOfDay`
 * (`"HH:mm"`) interpreted in the site time zone. The trigger is due when that
 * interval has elapsed since the most recent Run of the Automation — read from
 * the ledger by the evaluator.
 */

export type CronSchedule = {
  intervalMs: number;
  timeOfDay: TimeOfDay | null;
};

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

/**
 * The instant the trigger becomes due, given the most recent Run's start. The
 * interval base is the last run; an automation that never ran is due
 * immediately.
 */
export function nextCronFireAt(
  schedule: CronSchedule,
  lastRunAt: Date | null,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date {
  const base = lastRunAt ? lastRunAt.getTime() : 0;
  let due = base + schedule.intervalMs;

  if (schedule.timeOfDay) {
    due = alignToTimeOfDay(new Date(due), schedule.timeOfDay, timeZone).getTime();
  }

  return new Date(due);
}

export function isCronTriggerDue(
  data: JsonObject,
  lastRunAt: Date | null,
  now: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): boolean {
  const schedule = parseCronSchedule(data);

  if (!schedule) {
    return false;
  }

  return now.getTime() >= nextCronFireAt(schedule, lastRunAt, timeZone).getTime();
}
