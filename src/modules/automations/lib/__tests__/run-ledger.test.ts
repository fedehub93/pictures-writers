import { describe, expect, it } from "vitest";

import {
  formatDuration,
  formatSnapshotForDisplay,
  isTruncatedSnapshot,
  parseRunDateRange,
  resolveRunNodes,
} from "../run-ledger";

const graph = {
  nodes: [
    { id: "trigger", type: "manual", name: "manual", data: {} },
    { id: "wait", type: "wait", name: "Wait 1 day", data: {} },
    { id: "email", type: "sendEmail", name: null, data: {} },
  ],
  connections: [],
};

describe("run ledger helpers", () => {
  describe("resolveRunNodes", () => {
    it("maps each node id to its type and name from the frozen graph", () => {
      expect(resolveRunNodes(graph)).toEqual({
        trigger: { type: "manual", name: "manual" },
        wait: { type: "wait", name: "Wait 1 day" },
        email: { type: "sendEmail", name: null },
      });
    });

    it("returns an empty map for a malformed graph", () => {
      expect(resolveRunNodes({ not: "a graph" })).toEqual({});
      expect(resolveRunNodes(null)).toEqual({});
    });

    it("prefers an authored label stored in node data", () => {
      expect(
        resolveRunNodes({
          nodes: [
            {
              id: "welcome",
              type: "sendEmail",
              name: "sendEmail",
              data: { label: "Welcome email" },
            },
          ],
          connections: [],
        }),
      ).toEqual({
        welcome: { type: "sendEmail", name: "Welcome email" },
      });
    });
  });

  describe("isTruncatedSnapshot", () => {
    it("detects the engine's capped snapshot shape", () => {
      expect(isTruncatedSnapshot({ truncated: true, value: "abc" })).toBe(true);
    });

    it("does not flag ordinary snapshots", () => {
      expect(isTruncatedSnapshot({ email: "reader@example.com" })).toBe(false);
      expect(isTruncatedSnapshot([1, 2, 3])).toBe(false);
      expect(isTruncatedSnapshot("text")).toBe(false);
      expect(isTruncatedSnapshot(null)).toBe(false);
    });
  });

  describe("formatSnapshotForDisplay", () => {
    it("pretty-prints ordinary snapshots as JSON", () => {
      expect(formatSnapshotForDisplay({ a: 1 })).toBe('{\n  "a": 1\n}');
    });

    it("surfaces the retained prefix for a truncated snapshot", () => {
      expect(
        formatSnapshotForDisplay({ truncated: true, value: '{"a":' }),
      ).toBe('{"a":');
    });

    it("renders an empty string for a missing snapshot", () => {
      expect(formatSnapshotForDisplay(null)).toBe("");
      expect(formatSnapshotForDisplay(undefined)).toBe("");
    });
  });

  describe("parseRunDateRange", () => {
    it("expands a date-only range to cover the whole day in UTC", () => {
      const range = parseRunDateRange({
        from: "2026-01-01",
        to: "2026-01-02",
      });

      expect(range.gte?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
      expect(range.lte?.toISOString()).toBe("2026-01-02T23:59:59.999Z");
    });

    it("preserves full ISO datetimes", () => {
      const range = parseRunDateRange({
        from: "2026-01-01T08:30:00.000Z",
        to: "2026-01-01T09:45:00.000Z",
      });

      expect(range.gte?.toISOString()).toBe("2026-01-01T08:30:00.000Z");
      expect(range.lte?.toISOString()).toBe("2026-01-01T09:45:00.000Z");
    });

    it("ignores missing or invalid values", () => {
      expect(parseRunDateRange({})).toEqual({ gte: undefined, lte: undefined });
      expect(parseRunDateRange({ from: "not-a-date", to: "" })).toEqual({
        gte: undefined,
        lte: undefined,
      });
    });
  });

  describe("formatDuration", () => {
    it("renders sub-minute, minute, hour and day spans", () => {
      const start = new Date("2026-01-01T00:00:00.000Z");

      expect(formatDuration(start, new Date("2026-01-01T00:00:42.000Z"))).toBe(
        "42s",
      );
      expect(formatDuration(start, new Date("2026-01-01T00:05:30.000Z"))).toBe(
        "5m 30s",
      );
      expect(formatDuration(start, new Date("2026-01-01T03:20:00.000Z"))).toBe(
        "3h 20m",
      );
      expect(formatDuration(start, new Date("2026-01-03T06:00:00.000Z"))).toBe(
        "2d 6h",
      );
    });

    it("renders an em dash while the Run is still open", () => {
      expect(formatDuration(new Date(), null)).toBe("—");
    });
  });
});
