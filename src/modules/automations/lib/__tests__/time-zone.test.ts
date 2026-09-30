import { describe, expect, it } from "vitest";

import {
  alignToTimeOfDay,
  atTimeOfDayOnWallDay,
  normalizeTimeZone,
  parseTimeOfDay,
  timeOfDayAfterDays,
  waitResumeAt,
} from "../time-zone";

const ROME = "Europe/Rome";

describe("normalizeTimeZone", () => {
  it("keeps a valid IANA zone", () => {
    expect(normalizeTimeZone("Europe/Rome")).toBe("Europe/Rome");
  });

  it("falls back to UTC for empty or invalid values", () => {
    expect(normalizeTimeZone(undefined)).toBe("UTC");
    expect(normalizeTimeZone("")).toBe("UTC");
    expect(normalizeTimeZone("Mars/Olympus")).toBe("UTC");
  });
});

describe("parseTimeOfDay", () => {
  it("accepts valid 24h times and rejects the rest", () => {
    expect(parseTimeOfDay("09:30")).toEqual({ hours: 9, minutes: 30 });
    expect(parseTimeOfDay("24:00")).toBeNull();
    expect(parseTimeOfDay("noon")).toBeNull();
  });
});

describe("waitResumeAt (calendar days then anchor)", () => {
  // 2026-09-24 16:00 in Europe/Rome (CEST, UTC+2) is 14:00Z.
  const now = new Date("2026-09-24T14:00:00.000Z");

  it("resumes N calendar days later at the wall-clock time", () => {
    // Thu 16:00 -> Sat 10:00 in Rome (= 08:00Z).
    expect(
      waitResumeAt(now, 2 * 24 * 60 * 60 * 1000, { hours: 10, minutes: 0 }, ROME)
        .toISOString(),
    ).toBe("2026-09-26T08:00:00.000Z");
  });

  it("rolls forward a day when a zero delay has already passed", () => {
    // Same day 10:00 Rome is already past (16:00 there) -> tomorrow 10:00.
    expect(
      waitResumeAt(now, 0, { hours: 10, minutes: 0 }, ROME).toISOString(),
    ).toBe("2026-09-25T08:00:00.000Z");
  });

  it("handles daylight saving offsets via the zone, not a fixed offset", () => {
    // 2026-10-24 16:00 Rome is CEST (UTC+2); 2026-10-26 is CET (UTC+1).
    // DST ends 2026-10-25, so "2 days at 10:00" lands at 09:00Z, not 08:00Z.
    expect(
      waitResumeAt(
        new Date("2026-10-24T14:00:00.000Z"),
        2 * 24 * 60 * 60 * 1000,
        { hours: 10, minutes: 0 },
        ROME,
      ).toISOString(),
    ).toBe("2026-10-26T09:00:00.000Z");
  });
});

describe("cron alignment helpers", () => {
  const due = new Date("2026-09-25T06:00:00.000Z"); // 08:00 Rome

  it("aligns forward to the wall-clock time in the zone", () => {
    expect(
      alignToTimeOfDay(due, { hours: 9, minutes: 0 }, ROME).toISOString(),
    ).toBe("2026-09-25T07:00:00.000Z");
  });

  it("stays on the same wall day when the time is still ahead", () => {
    expect(
      atTimeOfDayOnWallDay(due, { hours: 9, minutes: 0 }, ROME).toISOString(),
    ).toBe("2026-09-25T07:00:00.000Z");
    expect(
      timeOfDayAfterDays(due, 1, { hours: 9, minutes: 0 }, ROME).toISOString(),
    ).toBe("2026-09-26T07:00:00.000Z");
  });
});
