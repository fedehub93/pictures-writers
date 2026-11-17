import { describe, expect, it } from "vitest";

import { ContentStatus } from "@/generated/prisma";

import {
  getSiteRegionStatusLabel,
  getSiteRegionStatusVariant,
  toSiteRegionSummary,
} from "../region-presentation";

const updatedAt = new Date("2026-01-02T10:00:00.000Z");

describe("toSiteRegionSummary", () => {
  it("marks a missing region as not created", () => {
    const summary = toSiteRegionSummary("HEADER", null);

    expect(summary).toMatchObject({
      key: "HEADER",
      title: "Header",
      status: null,
      currentVersionNumber: null,
      liveVersionNumber: null,
      updatedAt: null,
    });
  });

  it("summarises a region with a draft only", () => {
    const summary = toSiteRegionSummary("FOOTER", {
      id: "root-1",
      currentVersion: {
        id: "version-2",
        version: 2,
        status: ContentStatus.DRAFT,
        updatedAt,
      },
      liveVersion: null,
      updatedAt,
    });

    expect(summary).toMatchObject({
      status: ContentStatus.DRAFT,
      currentVersionNumber: 2,
      liveVersionNumber: null,
      updatedAt,
    });
  });

  it("prefers the current version timestamp over the root timestamp", () => {
    const rootUpdatedAt = new Date("2025-01-01T00:00:00.000Z");

    const summary = toSiteRegionSummary("FOOTER", {
      id: "root-1",
      currentVersion: {
        id: "version-1",
        version: 1,
        status: ContentStatus.DRAFT,
        updatedAt,
      },
      liveVersion: null,
      updatedAt: rootUpdatedAt,
    });

    expect(summary.updatedAt).toBe(updatedAt);
  });

  it("summarises a published region with unpublished changes", () => {
    const summary = toSiteRegionSummary("HEADER", {
      id: "root-1",
      currentVersion: {
        id: "version-3",
        version: 3,
        status: ContentStatus.CHANGED,
        updatedAt,
      },
      liveVersion: { version: 2, publishedAt: updatedAt },
      updatedAt,
    });

    expect(summary).toMatchObject({
      status: ContentStatus.CHANGED,
      currentVersionNumber: 3,
      liveVersionNumber: 2,
      publishedAt: updatedAt,
    });
  });
});

describe("getSiteRegionStatusLabel", () => {
  it("labels every publishing state", () => {
    expect(getSiteRegionStatusLabel(null)).toBe("Not created");
    expect(getSiteRegionStatusLabel(ContentStatus.DRAFT)).toBe("Draft");
    expect(getSiteRegionStatusLabel(ContentStatus.CHANGED)).toBe(
      "Unpublished changes",
    );
    expect(getSiteRegionStatusLabel(ContentStatus.PUBLISHED)).toBe("Published");
    expect(getSiteRegionStatusLabel(ContentStatus.SCHEDULED)).toBe("Scheduled");
  });
});

describe("getSiteRegionStatusVariant", () => {
  it("uses a badge variant for each publishing state", () => {
    expect(getSiteRegionStatusVariant(ContentStatus.PUBLISHED)).toBe("default");
    expect(getSiteRegionStatusVariant(ContentStatus.CHANGED)).toBe("secondary");
    expect(getSiteRegionStatusVariant(ContentStatus.DRAFT)).toBe("secondary");
    expect(getSiteRegionStatusVariant(ContentStatus.SCHEDULED)).toBe("outline");
    expect(getSiteRegionStatusVariant(null)).toBe("outline");
  });
});
