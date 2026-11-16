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

import { migrateLayoutBlockDocuments } from "../migrate-layout-block-documents";

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
  root: { props: {} },
  content: [
    {
      type: "Grid",
      props: {
        id: "grid-1",
        items: [{ type: "Text", props: { id: "text-1", text: "Hello" } }],
      },
    },
  ],
};

const migratedPage = {
  root: { props: {} },
  content: [
    {
      type: "Container",
      props: {
        id: "grid-1",
        items: [{ type: "Text", props: { id: "text-1", text: "Hello" } }],
        layout: { desktop: { display: "grid" } },
      },
    },
  ],
};

const legacyRegion = {
  root: { props: {} },
  content: [
    {
      type: "Flex",
      props: { id: "flex-1", items: [] },
    },
  ],
};

const migratedRegion = {
  root: { props: {} },
  content: [
    {
      type: "Container",
      props: {
        id: "flex-1",
        items: [],
        layout: { desktop: { display: "flex" } },
      },
    },
  ],
};

describe("migrateLayoutBlockDocuments", () => {
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

    const report = await migrateLayoutBlockDocuments({ dryRun: true });

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
            componentType: "Grid",
            componentId: "grid-1",
            display: "grid",
            wroteDisplay: true,
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
            componentType: "Flex",
            componentId: "flex-1",
            display: "flex",
            wroteDisplay: true,
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

    const report = await migrateLayoutBlockDocuments();

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
    const report = await migrateLayoutBlockDocuments({
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
      "migrate siteRegion HEADER v1: Flex#flex-1 -> Container, display flex",
    );
  });

  it("reports the nodes it would touch in a dry run", async () => {
    dbMocks.pageFindMany.mockResolvedValue([
      pageRow("page-v1", 1, "home", legacyPage),
    ]);

    const progress: string[] = [];
    await migrateLayoutBlockDocuments({
      dryRun: true,
      onProgress: (line) => progress.push(line),
    });

    expect(progress).toContain(
      "would migrate page home v1: Grid#grid-1 -> Container, display grid",
    );
  });

  it("reports a retired node it cannot convert without writing the document", async () => {
    dbMocks.regionFindMany.mockResolvedValue([
      regionRow("region-v1", 1, "FOOTER", {
        root: { props: {} },
        content: [{ type: "Grid", props: "not an object" }],
      }),
    ]);

    const progress: string[] = [];
    const report = await migrateLayoutBlockDocuments({
      onProgress: (line) => progress.push(line),
    });

    expect(report).toMatchObject({ changed: 0, unchanged: 1 });
    expect(report.documents).toEqual([
      {
        table: "siteRegion",
        versionId: "region-v1",
        label: "FOOTER",
        version: 1,
        changes: [],
        warnings: [
          {
            componentType: "Grid",
            reason: "props is not an object; left unchanged",
          },
        ],
      },
    ]);
    expect(dbMocks.regionUpdate).not.toHaveBeenCalled();
    expect(progress).toContain(
      "warn siteRegion FOOTER v1: Grid — props is not an object; left unchanged",
    );
  });

  it("reports no changes on a second run", async () => {
    dbMocks.pageFindMany.mockResolvedValue([
      pageRow("page-v1", 1, "home", migratedPage),
    ]);
    dbMocks.regionFindMany.mockResolvedValue([
      regionRow("region-v1", 1, "HEADER", migratedRegion),
    ]);

    const report = await migrateLayoutBlockDocuments({ dryRun: true });

    expect(report).toMatchObject({
      scanned: 2,
      changed: 0,
      unchanged: 2,
      documents: [],
    });
  });
});
