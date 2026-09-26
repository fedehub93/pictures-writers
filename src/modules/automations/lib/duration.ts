/**
 * Duration parsing shared by the Wait node and the Cron trigger.
 *
 * Accepts a number of milliseconds, a numeric string, a human duration such as
 * `"5 minutes"`/`"2d"`, or an object of unit fields (`{ days: 1, hours: 6 }`).
 */

const OBJECT_DURATION_MULTIPLIERS: Record<string, number> = {
  ms: 1,
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
};

export function parseDuration(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = trimmed.match(
    /^(-?\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|seconds?|m|minutes?|h|hours?|d|days?|w|weeks?)$/i,
  );
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    millisecond: 1,
    milliseconds: 1,
    s: 1000,
    second: 1000,
    seconds: 1000,
    m: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    h: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };

  return amount * (multipliers[unit] ?? 1);
}

function parseNumberMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return null;
}

export function readObjectDuration(value: unknown): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const total = Object.entries(OBJECT_DURATION_MULTIPLIERS).reduce(
    (sum, [key, multiplier]) => {
      const duration = parseNumberMs(record[key]);
      return duration === null ? sum : sum + duration * multiplier;
    },
    0,
  );

  return total > 0 ? total : null;
}

/** Parse any accepted duration shape into milliseconds, or `null`. */
export function parseDurationValue(value: unknown): number | null {
  return parseDuration(value) ?? readObjectDuration(value);
}
