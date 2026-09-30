import { describe, expect, it } from "vitest";

import {
  isCronTriggerDue,
  nextCronFireAt,
  parseCronSchedule,
} from "../cron-schedule";

describe("parseCronSchedule", () => {
  it("reads a millisecond interval", () => {
    expect(parseCronSchedule({ interval: 3_600_000 })).toEqual({
      intervalMs: 3_600_000,
      timeOfDay: null,
    });
  });

  it("reads a human duration interval", () => {
    expect(parseCronSchedule({ interval: "2 days" })?.intervalMs).toBe(
      2 * 24 * 60 * 60 * 1000,
    );
    expect(parseCronSchedule({ interval: "15m" })?.intervalMs).toBe(15 * 60 * 1000);
  });

  it("reads an object interval", () => {
    expect(parseCronSchedule({ interval: { hours: 1, minutes: 30 } })?.intervalMs).toBe(
      90 * 60 * 1000,
    );
  });

  it("reads an optional time of day", () => {
    expect(
      parseCronSchedule({ interval: "1 day", timeOfDay: "09:30" })?.timeOfDay,
    ).toEqual({ hours: 9, minutes: 30 });
  });

  it("rejects a non-positive or missing interval", () => {
    expect(parseCronSchedule({})).toBeNull();
    expect(parseCronSchedule({ interval: 0 })).toBeNull();
    expect(parseCronSchedule({ interval: "not a duration" })).toBeNull();
    expect(parseCronSchedule({ interval: -5 })).toBeNull();
  });
});

describe("nextCronFireAt", () => {
  const schedule = { intervalMs: 60 * 60 * 1000, timeOfDay: null };

  it("fires one interval after the most recent run", () => {
    const lastRunAt = new Date("2026-09-25T10:00:00.000Z");
    expect(nextCronFireAt(schedule, lastRunAt).toISOString()).toBe(
      "2026-09-25T11:00:00.000Z",
    );
  });

  it("is immediately due when the automation never ran", () => {
    expect(nextCronFireAt(schedule, null).getTime()).toBeLessThan(
      Date.now(),
    );
  });

  it("aligns to the configured time of day at/after the interval", () => {
    const lastRunAt = new Date("2026-09-25T08:00:00.000Z");
    const daily = {
      intervalMs: 24 * 60 * 60 * 1000,
      timeOfDay: { hours: 9, minutes: 0 },
    };
    expect(nextCronFireAt(daily, lastRunAt).toISOString()).toBe(
      "2026-09-26T09:00:00.000Z",
    );
  });

  it("aligns the time of day in the site time zone", () => {
    const daily = {
      intervalMs: 24 * 60 * 60 * 1000,
      timeOfDay: { hours: 9, minutes: 0 },
    };
    // 08:00 in Rome (06:00Z) + 1 day, anchored to 09:00 Rome == 07:00Z.
    expect(
      nextCronFireAt(daily, new Date("2026-09-24T06:00:00.000Z"), "Europe/Rome")
        .toISOString(),
    ).toBe("2026-09-25T07:00:00.000Z");
  });
});

describe("isCronTriggerDue", () => {
  it("is not due before the interval elapses", () => {
    const lastRunAt = new Date("2026-09-25T10:00:00.000Z");
    expect(
      isCronTriggerDue(
        { interval: "1 hour" },
        lastRunAt,
        new Date("2026-09-25T10:59:59.000Z"),
      ),
    ).toBe(false);
  });

  it("is due once the interval has elapsed", () => {
    const lastRunAt = new Date("2026-09-25T10:00:00.000Z");
    expect(
      isCronTriggerDue(
        { interval: "1 hour" },
        lastRunAt,
        new Date("2026-09-25T11:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("is due when the automation has never run", () => {
    expect(
      isCronTriggerDue({ interval: "5 minutes" }, null, new Date()),
    ).toBe(true);
  });

  it("is never due without a valid interval", () => {
    expect(isCronTriggerDue({}, null, new Date())).toBe(false);
  });
});
