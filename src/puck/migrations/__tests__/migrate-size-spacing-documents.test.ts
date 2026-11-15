import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  pageFindMany: vi.fn(),
  pageUpdate: vi.fn(),
  regionFindMany: vi.fn(),
  regionUpdate: vi.fn(),
}));

vi.mock("@/shared/lib/db", () => ({
  db: {
    pageVersion: {
      findMany: dbMocks.pageFindMany,
      update: dbMocks.pageUpdate,
    },
    siteRegionVersion: {
      findMany: dbMocks.regionFindMany,
      update: dbMocks.regionUpdate,
    },
  },
}));

import { migrateSizeSpacingDocuments } from "../migrate-size-spacing-documents";

function pageRow(id: string, version: number, slug: string, puckData: unknown) {
  return { id, version, root: { slug }, puckData };
}

function regionRow(
  id: string,
  version: number,
  key: "HEADER" | "FOOTER",
  puckData: unknown,
) {
  return { id, version, root: { key }, puckData };
}

const legacyPage = {
  root: {
    props: {
      dimension: {
        desktop: { maxWidth: "72rem", marginTop: "1rem" },
      },
    },
  },
  content: [
    {
      type: "Button",
      props: {
        id: "button-1",
        dimension: { desktop: { width: "12rem", paddingTop: "0.5rem" } },
      },
    },
  ],
};

const migratedPage = {
  root: {
    props: {
      size: { desktop: { maxWidth: "72rem" } },
      spacing: { desktop: { marginTop: "1rem" } },
    },
  },
  content: [
    {
      type: "Button",
      props: {
        id: "button-1",
        size: { desktop: { width: "12rem" } },
        spacing: { desktop: { paddingTop: "0.5rem" } },
      },
    },
  ],
};

const legacyRegion = {
  root: {
    props: {
      dimension: { desktop: { paddingTop: "2rem", paddingBottom: "2rem" } },
    },
  },
  content: [],
};

const migratedRegion = {
  root: {
    props: {
      spacing: { desktop: { paddingTop: "2rem", paddingBottom: "2rem" } },
    },
  },
  content: [],
};

const malformedRegion = {
  root: { props: {} },
  content: [
    {
      type: "Text",
      props: { id: "text-1", dimension: "2rem" },
    },
  ],
};

describe("migrateSizeSpacingDocuments", () => {
  beforeEach(() => {
    dbMocks.pageFindMany.mockReset().mockResolvedValue([]);
    dbMocks.pageUpdate.mockReset().mockResolvedValue({});
    dbMocks.regionFindMany.mockReset().mockResolvedValue([]);
    dbMocks.regionUpdate.mockReset().mockResolvedValue({});
  });

  it("reports every stored version of both tables and writes nothing in dry-run mode", async () => {
    dbMocks.pageFindMany.mockResolvedValue([
      pageRow("page-v1", 1, "home", legacyPage),
      pageRow("page-v2", 2, "home", migratedPage),
      pageRow("page-v3", 3, "home", null),
    ]);
    dbMocks.regionFindMany.mockResolvedValue([
      regionRow("region-v1", 1, "HEADER", legacyRegion),
      regionRow("region-v2", 2, "FOOTER", null),
    ]);

    const report = await migrateSizeSpacingDocuments({ dryRun: true });

    expect(report).toMatchObject({
      scanned: 5,
      changed: 2,
      unchanged: 1,
      skipped: 2,
      failed: [],
      dryRun: true,
    });
    expect(report.documents).toEqual([
      {
        table: "page",
        versionId: "page-v1",
        label: "home",
        version: 1,
        changes: [
          {
            componentType: "root",
            componentId: undefined,
            size: ["maxWidth"],
            spacing: ["marginTop"],
          },
          {
            componentType: "Button",
            componentId: "button-1",
            size: ["width"],
            spacing: ["paddingTop"],
          },
        ],
        warnings: [],
      },
      {
        table: "siteRegion",
        versionId: "region-v1",
        label: "HEADER",
        version: 1,
        changes: [
          {
            componentType: "root",
            componentId: undefined,
            size: [],
            spacing: ["paddingTop", "paddingBottom"],
          },
        ],
        warnings: [],
      },
    ]);
    expect(dbMocks.pageUpdate).not.toHaveBeenCalled();
    expect(dbMocks.regionUpdate).not.toHaveBeenCalled();
  });

  it("writes the migrated document of both tables", async () => {
    dbMocks.pageFindMany.mockResolvedValue([
      pageRow("page-v1", 1, "home", legacyPage),
    ]);
    dbMocks.regionFindMany.mockResolvedValue([
      regionRow("region-v1", 1, "HEADER", legacyRegion),
    ]);

    const report = await migrateSizeSpacingDocuments();

    expect(report).toMatchObject({ scanned: 2, changed: 2, unchanged: 0 });
    expect(dbMocks.pageUpdate).toHaveBeenCalledTimes(1);
    expect(dbMocks.pageUpdate).toHaveBeenCalledWith({
      where: { id: "page-v1" },
      data: { puckData: migratedPage },
    });
    expect(dbMocks.regionUpdate).toHaveBeenCalledTimes(1);
    expect(dbMocks.regionUpdate).toHaveBeenCalledWith({
      where: { id: "region-v1" },
      data: { puckData: migratedRegion },
    });
  });

  it("keeps going when one row cannot be written", async () => {
    dbMocks.pageFindMany.mockResolvedValue([
      pageRow("page-v1", 1, "home", legacyPage),
    ]);
    dbMocks.regionFindMany.mockResolvedValue([
      regionRow("region-v1", 1, "HEADER", legacyRegion),
    ]);
    dbMocks.pageUpdate.mockRejectedValueOnce(new Error("write failed"));

    const progress: string[] = [];
    const report = await migrateSizeSpacingDocuments({
      onProgress: (line) => progress.push(line),
    });

    expect(report.scanned).toBe(2);
    expect(report.changed).toBe(1);
    expect(report.failed).toEqual([
      {
        table: "page",
        versionId: "page-v1",
        label: "home",
        version: 1,
        reason: "write failed",
      },
    ]);
    expect(report.documents.map((document) => document.versionId)).toEqual([
      "region-v1",
    ]);
    expect(progress).toContain("fail page home v1: write failed");
    expect(progress).toContain(
      "migrate siteRegion HEADER v1: root: spacing paddingTop, paddingBottom",
    );
  });

  it("reports warning-only documents without writing them", async () => {
    dbMocks.regionFindMany.mockResolvedValue([
      regionRow("region-v1", 1, "FOOTER", malformedRegion),
    ]);

    const progress: string[] = [];
    const report = await migrateSizeSpacingDocuments({
      onProgress: (line) => progress.push(line),
    });

    expect(report.changed).toBe(0);
    expect(report.unchanged).toBe(1);
    expect(report.documents).toEqual([
      {
        table: "siteRegion",
        versionId: "region-v1",
        label: "FOOTER",
        version: 1,
        changes: [],
        warnings: [
          {
            componentType: "Text",
            componentId: "text-1",
            reason: "dimension is not a responsive map; left unchanged",
          },
        ],
      },
    ]);
    expect(dbMocks.regionUpdate).not.toHaveBeenCalled();
    expect(progress).toContain(
      "warn siteRegion FOOTER v1: Text#text-1 — dimension is not a responsive map; left unchanged",
    );
  });

  it("reports the fields it would move in a dry run", async () => {
    dbMocks.pageFindMany.mockResolvedValue([
      pageRow("page-v1", 1, "home", legacyPage),
    ]);

    const progress: string[] = [];
    await migrateSizeSpacingDocuments({
      dryRun: true,
      onProgress: (line) => progress.push(line),
    });

    expect(progress).toContain(
      "would migrate page home v1: root: size maxWidth; spacing marginTop; Button#button-1: size width; spacing paddingTop",
    );
  });
});
