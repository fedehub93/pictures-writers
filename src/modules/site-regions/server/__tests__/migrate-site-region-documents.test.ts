import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/shared/lib/db", () => ({
  db: {
    siteRegionVersion: {
      findMany: dbMocks.findMany,
      update: dbMocks.update,
    },
  },
}));

import { migrateSiteRegionDocuments } from "../migrate-site-region-documents";

function storedVersion(
  id: string,
  version: number,
  key: "HEADER" | "FOOTER",
  puckData: unknown,
) {
  return { id, version, root: { key }, puckData };
}

const legacyBrand = {
  root: {},
  content: [
    {
      type: "Brand",
      props: { id: "brand-1", showLogo: false, showSiteName: true },
    },
  ],
};

const migratedBrand = {
  root: {},
  content: [
    {
      type: "Brand",
      props: {
        id: "brand-1",
        content: { showLogo: false, showSiteName: true },
      },
    },
  ],
};

const announcementBar = {
  root: {},
  content: [
    {
      type: "AnnouncementBar",
      props: { id: "announcement-1", text: "Free shipping" },
    },
  ],
};

describe("migrateSiteRegionDocuments", () => {
  beforeEach(() => {
    dbMocks.findMany.mockReset();
    dbMocks.update.mockReset();
    dbMocks.update.mockResolvedValue({});
  });

  it("reports each changed document and does not write in dry-run mode", async () => {
    dbMocks.findMany.mockResolvedValue([
      storedVersion("version-1", 1, "HEADER", legacyBrand),
      storedVersion("version-2", 2, "HEADER", null),
      storedVersion("version-3", 3, "FOOTER", migratedBrand),
    ]);

    const report = await migrateSiteRegionDocuments({ dryRun: true });

    expect(report).toMatchObject({
      scanned: 3,
      changed: 1,
      unchanged: 1,
      skipped: 1,
      dryRun: true,
    });
    expect(report.failed).toEqual([]);
    expect(report.documents).toEqual([
      {
        versionId: "version-1",
        regionKey: "HEADER",
        version: 1,
        changes: [
          {
            componentType: "Brand",
            componentId: "brand-1",
            fields: ["showLogo", "showSiteName"],
          },
        ],
        warnings: [],
      },
    ]);
    expect(dbMocks.update).not.toHaveBeenCalled();
  });

  it("writes the migrated document and reports the changed version", async () => {
    dbMocks.findMany.mockResolvedValue([
      storedVersion("version-1", 1, "HEADER", legacyBrand),
    ]);

    const report = await migrateSiteRegionDocuments();

    expect(report.changed).toBe(1);
    expect(report.documents).toHaveLength(1);
    expect(dbMocks.update).toHaveBeenCalledTimes(1);
    expect(dbMocks.update).toHaveBeenCalledWith({
      where: { id: "version-1" },
      data: { puckData: migratedBrand },
    });
  });

  it("keeps going when one document cannot be written", async () => {
    dbMocks.findMany.mockResolvedValue([
      storedVersion("version-1", 1, "HEADER", legacyBrand),
      storedVersion("version-2", 2, "FOOTER", legacyBrand),
    ]);
    dbMocks.update
      .mockRejectedValueOnce(new Error("write failed"))
      .mockResolvedValueOnce({});

    const progress: string[] = [];
    const report = await migrateSiteRegionDocuments({
      onProgress: (line) => progress.push(line),
    });

    expect(report.scanned).toBe(2);
    expect(report.changed).toBe(1);
    expect(report.failed).toEqual([
      {
        versionId: "version-1",
        regionKey: "HEADER",
        version: 1,
        reason: "write failed",
      },
    ]);
    expect(report.documents.map((document) => document.versionId)).toEqual([
      "version-2",
    ]);
    expect(progress).toContain("fail HEADER v1: write failed");
    expect(progress).toContain(
      "migrate FOOTER v2: Brand#brand-1: showLogo, showSiteName",
    );
  });

  it("reports warning-only documents without writing them", async () => {
    dbMocks.findMany.mockResolvedValue([
      storedVersion("version-1", 1, "HEADER", announcementBar),
    ]);

    const report = await migrateSiteRegionDocuments();

    expect(report.changed).toBe(0);
    expect(report.unchanged).toBe(1);
    expect(report.documents).toEqual([
      {
        versionId: "version-1",
        regionKey: "HEADER",
        version: 1,
        changes: [],
        warnings: [
          {
            componentType: "AnnouncementBar",
            componentId: "announcement-1",
            reason:
              "legacy AnnouncementBar block is not migrated; recreate it as a Top bar in the editor",
          },
        ],
      },
    ]);
    expect(dbMocks.update).not.toHaveBeenCalled();
  });
});
