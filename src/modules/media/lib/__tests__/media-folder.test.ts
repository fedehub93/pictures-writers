import { describe, expect, it } from "vitest";

import {
  buildFolderTree,
  mediaUploadFolderId,
  wouldCreateCycle,
  type MediaFolderRow,
} from "../media-folder";

const rows: MediaFolderRow[] = [
  { id: "campaigns", name: "Campaigns", parentId: null },
  { id: "spring", name: "Spring", parentId: "campaigns" },
  { id: "heroes", name: "Heroes", parentId: "spring" },
  { id: "products", name: "Products", parentId: null },
];

describe("buildFolderTree", () => {
  it("nests children under their parent and keeps the roots at the top", () => {
    const tree = buildFolderTree(rows);

    expect(tree.map((node) => node.name)).toEqual(["Campaigns", "Products"]);
    expect(tree[0]!.children.map((node) => node.name)).toEqual(["Spring"]);
    expect(tree[0]!.children[0]!.children.map((node) => node.name)).toEqual([
      "Heroes",
    ]);
    expect(tree[1]!.children).toEqual([]);
  });

  it("orders siblings by name regardless of the order the rows arrive in", () => {
    const tree = buildFolderTree([
      { id: "b", name: "Beta", parentId: null },
      { id: "a", name: "Alpha", parentId: null },
    ]);

    expect(tree.map((node) => node.name)).toEqual(["Alpha", "Beta"]);
  });

  it("keeps a folder whose parent is missing as a root instead of dropping it", () => {
    const tree = buildFolderTree([
      { id: "orphan", name: "Orphan", parentId: "gone" },
    ]);

    expect(tree.map((node) => node.name)).toEqual(["Orphan"]);
  });
});

describe("mediaUploadFolderId", () => {
  it("files an upload into the folder My Drive has open", () => {
    expect(mediaUploadFolderId({ view: "active", folderId: "spring" })).toBe(
      "spring",
    );
  });

  it("files an upload at the root when My Drive has no folder open", () => {
    expect(mediaUploadFolderId({ view: "active", folderId: null })).toBeNull();
  });

  it("files an upload at the root in a flat view, even with a folder open", () => {
    expect(
      mediaUploadFolderId({ view: "archived", folderId: "spring" }),
    ).toBeNull();
  });
});

describe("wouldCreateCycle", () => {
  it("refuses making a folder its own parent", () => {
    expect(wouldCreateCycle(rows, "spring", "spring")).toBe(true);
  });

  it("refuses moving a folder inside one of its descendants", () => {
    expect(wouldCreateCycle(rows, "campaigns", "heroes")).toBe(true);
  });

  it("allows moving a folder under an unrelated folder", () => {
    expect(wouldCreateCycle(rows, "spring", "products")).toBe(false);
  });

  it("allows moving a folder back to the root", () => {
    expect(wouldCreateCycle(rows, "campaigns", null)).toBe(false);
  });

  it("refuses when the rows already contain a cycle", () => {
    expect(
      wouldCreateCycle(
        [
          { id: "a", name: "A", parentId: "b" },
          { id: "b", name: "B", parentId: "a" },
        ],
        "c",
        "a",
      ),
    ).toBe(true);
  });
});
