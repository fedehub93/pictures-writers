import { describe, expect, it } from "vitest";

import {
  BYTES_PER_MEGABYTE,
  MEDIA_QUOTA_DEFAULT_MB,
  fitsMediaQuota,
  mediaQuotaStatus,
  mediaUsageBytes,
  megabytesToBytes,
  parseMediaQuotaMb,
} from "../quota";

const MB = BYTES_PER_MEGABYTE;

describe("mediaUsageBytes", () => {
  it("is zero for an empty library", () => {
    expect(mediaUsageBytes([])).toBe(0);
  });

  it("sums the originals only when there are no renditions", () => {
    expect(
      mediaUsageBytes([
        { size: 400, renditions: null },
        { size: 600, renditions: undefined },
        { size: 1000, renditions: [] },
      ]),
    ).toBe(2000);
  });

  it("adds the bytes recorded in each rendition manifest", () => {
    expect(
      mediaUsageBytes([
        {
          size: 1000,
          renditions: [
            { key: "a", width: 320, height: 200, bytes: 200, format: "webp" },
            { key: "b", width: 320, height: 200, bytes: 150, format: "avif" },
          ],
        },
      ]),
    ).toBe(1350);
  });

  it("counts archived media exactly like active media", () => {
    const rows = [
      { size: 500, renditions: null },
      {
        size: 500,
        renditions: [
          { key: "a", width: 320, height: 200, bytes: 100, format: "webp" },
        ],
        archivedAt: new Date("2026-11-18T10:00:00Z"),
      },
    ];

    expect(mediaUsageBytes(rows)).toBe(1100);
  });

  it("ignores unknown sizes and malformed manifests", () => {
    expect(
      mediaUsageBytes([
        { size: null, renditions: null },
        { size: 100, renditions: "not-a-manifest" },
        { size: 100, renditions: [null, {}, { bytes: "12" }, { bytes: -5 }] },
      ]),
    ).toBe(200);
  });
});

describe("fitsMediaQuota", () => {
  it("allows a library exactly at the limit", () => {
    expect(fitsMediaQuota(MB, 0, 1)).toBe(true);
    expect(fitsMediaQuota(MB - 1, 1, 1)).toBe(true);
  });

  it("refuses an upload one byte over the limit", () => {
    expect(fitsMediaQuota(MB, 1, 1)).toBe(false);
    expect(fitsMediaQuota(MB + 1, 0, 1)).toBe(false);
  });

  it("counts megabytes as binary megabytes", () => {
    expect(megabytesToBytes(1)).toBe(1048576);
    expect(megabytesToBytes(MEDIA_QUOTA_DEFAULT_MB)).toBe(5 * 1024 * MB);
  });
});

describe("mediaQuotaStatus", () => {
  it("reports used and total figures", () => {
    expect(mediaQuotaStatus(2 * MB, 10)).toMatchObject({
      usedBytes: 2 * MB,
      totalBytes: 10 * MB,
      ratio: 0.2,
      percent: 20,
      level: "ok",
    });
  });

  it("clamps the displayed percentage at 100", () => {
    expect(mediaQuotaStatus(11 * MB, 10).percent).toBe(100);
  });

  it("does not warn at exactly 80%", () => {
    expect(mediaQuotaStatus(8 * MB, 10).level).toBe("ok");
  });

  it("warns above 80%", () => {
    expect(mediaQuotaStatus(8 * MB + 1, 10).level).toBe("warning");
  });

  it("is still a warning at exactly the limit and exceeded one byte after", () => {
    expect(mediaQuotaStatus(10 * MB, 10).level).toBe("warning");
    expect(mediaQuotaStatus(10 * MB + 1, 10).level).toBe("exceeded");
  });
});

describe("parseMediaQuotaMb", () => {
  it("accepts the string a number input submits", () => {
    expect(parseMediaQuotaMb("5120")).toBe(5120);
    expect(parseMediaQuotaMb(" 7 ")).toBe(7);
    expect(parseMediaQuotaMb(5120)).toBe(5120);
  });

  it("rejects empty, fractional and below-one values", () => {
    expect(parseMediaQuotaMb("")).toBeNull();
    expect(parseMediaQuotaMb("0")).toBeNull();
    expect(parseMediaQuotaMb("-5")).toBeNull();
    expect(parseMediaQuotaMb("1.5")).toBeNull();
    expect(parseMediaQuotaMb("many")).toBeNull();
    expect(parseMediaQuotaMb(null)).toBeNull();
    expect(parseMediaQuotaMb(undefined)).toBeNull();
  });
});
