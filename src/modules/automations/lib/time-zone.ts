import { addDays, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

/**
 * Time-zone helpers shared by the Cron trigger and the Wait node.
 *
 * The site authors schedules in a single IANA time zone (the `Settings.timezone`),
 * so "2 days at 09:00" means 09:00 wall-clock in that zone. All conversions go
 * through `date-fns-tz` so daylight-saving transitions are handled correctly;
 * `UTC` is a safe fallback when no zone is configured.
 */

export const DEFAULT_TIME_ZONE = "UTC";

export const DAY_MS = 24 * 60 * 60 * 1000;

export type TimeOfDay = {
  hours: number;
  minutes: number;
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

/** True when `value` names a zone the runtime understands. */
export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Coerces a stored zone to a usable one, falling back to `UTC`. */
export function normalizeTimeZone(value: unknown): string {
  return isValidTimeZone(value) ? value : DEFAULT_TIME_ZONE;
}

function pad(part: number): string {
  return String(part).padStart(2, "0");
}

/** Wall-clock date (year/month/day as read locally) of `instant` in `timeZone`. */
function zonedWallDate(instant: Date, timeZone: string): Date {
  return toZonedTime(instant, timeZone);
}

function wallClockString(wallDay: Date, timeOfDay: TimeOfDay): string {
  return `${format(wallDay, "yyyy-MM-dd")}T${pad(timeOfDay.hours)}:${pad(
    timeOfDay.minutes,
  )}:00`;
}

/** Instant at `timeOfDay` on the same wall-clock day as `instant`. */
export function atTimeOfDayOnWallDay(
  instant: Date,
  timeOfDay: TimeOfDay,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date {
  return fromZonedTime(
    wallClockString(zonedWallDate(instant, timeZone), timeOfDay),
    timeZone,
  );
}

/** Instant at `timeOfDay` `days` wall-clock days after `instant`. */
export function timeOfDayAfterDays(
  instant: Date,
  days: number,
  timeOfDay: TimeOfDay,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date {
  const wallDay = addDays(zonedWallDate(instant, timeZone), days);
  return fromZonedTime(wallClockString(wallDay, timeOfDay), timeZone);
}

/**
 * Forward alignment: the first occurrence of `timeOfDay` at or after `instant`.
 * If the time has already passed on `instant`'s wall-clock day, rolls to the
 * next day. Used by the Cron trigger.
 */
export function alignToTimeOfDay(
  instant: Date,
  timeOfDay: TimeOfDay,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date {
  const sameDay = atTimeOfDayOnWallDay(instant, timeOfDay, timeZone);
  return sameDay.getTime() >= instant.getTime()
    ? sameDay
    : timeOfDayAfterDays(instant, 1, timeOfDay, timeZone);
}

/**
 * The Wait node's "delay then anchor" resume time: `days` whole wall-clock days
 * after `instant`, at `timeOfDay`, rolled one more day if that instant is not
 * strictly in the future. A zero delay with an already-passed time therefore
 * resumes tomorrow at that time.
 */
export function waitResumeAt(
  instant: Date,
  delayMs: number,
  timeOfDay: TimeOfDay,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date {
  const days = Math.max(0, Math.ceil(delayMs / DAY_MS));
  const candidate = timeOfDayAfterDays(instant, days, timeOfDay, timeZone);

  return candidate.getTime() > instant.getTime()
    ? candidate
    : timeOfDayAfterDays(instant, days + 1, timeOfDay, timeZone);
}
