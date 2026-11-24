import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Same seam as media-router.test.ts: the procedures are exercised without the
// auth middleware, so the test talks to the router and the database only.
vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

import { createCallerFactory } from "@/trpc/init";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { mediaRouter } from "../procedures";
import type { MediaFolderNode } from "../../lib/media-folder";

const createCaller = createCallerFactory(mediaRouter);

const folderIds: string[] = [];
const mediaIds: string[] = [];

let caller: ReturnType<typeof createCaller>;
let marker: string;

beforeEach(() => {
  folderIds.length = 0;
  mediaIds.length = 0;
  marker = `Folder ${randomUUID()}`;
  caller = createCaller({ userId: "media-folder-test", auth: { id: "media-folder-test" } });
});

afterEach(async () => {
  if (mediaIds.length > 0) {
    await db.media.deleteMany({ where: { id: { in: mediaIds } } });
  }

  // The foreign key restricts deletion, so remove leaves until the tracked
  // folders are gone; a parent can only go after its children.
  for (let guard = 0; guard < 20 && folderIds.length > 0; guard += 1) {
    const leaves = await db.mediaFolder.findMany({
      where: { id: { in: folderIds }, children: { none: {} } },
      select: { id: true },
    });
    if (leaves.length === 0) break;
    await db.mediaFolder.deleteMany({
      where: { id: { in: leaves.map((leaf) => leaf.id) } },
    });
  }

  folderIds.length = 0;
  mediaIds.length = 0;
});

async function createFolder(name: string, parentId: string | null = null) {
  const folder = await db.mediaFolder.create({ data: { name, parentId } });
  folderIds.push(folder.id);
  return folder;
}

async function createMediaInFolder(folderId: string | null) {
  const media = await db.media.create({
    data: { name: `Media ${randomUUID()}`, type: MediaType.FILE, folderId },
  });
  mediaIds.push(media.id);
  return media;
}

function findNode(
  tree: MediaFolderNode[],
  id: string,
): MediaFolderNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const match = findNode(node.children, id);
    if (match) return match;
  }
  return null;
}

describe("media folders", () => {
  describe("getFolderTree", () => {
    it("returns the folders nested under their parents in name order", async () => {
      const root = await createFolder(`${marker} B`);
      const sibling = await createFolder(`${marker} A`);
      const child = await createFolder(`${marker} Child`, root.id);

      const tree = await caller.getFolderTree();
      const roots = tree.filter((node) => node.name.startsWith(marker));

      expect(roots.map((node) => node.name)).toEqual([
        `${marker} A`,
        `${marker} B`,
      ]);
      expect(findNode(tree, sibling.id)?.children).toEqual([]);
      expect(findNode(tree, child.id)?.parentId).toBe(root.id);
      expect(findNode(tree, root.id)?.children.map((node) => node.id)).toEqual([
        child.id,
      ]);
    });
  });

  describe("createFolder", () => {
    it("creates a folder inside the chosen parent", async () => {
      const parent = await createFolder(`${marker} parent`);
      const created = await caller.createFolder({
        name: `  ${marker} child  `,
        parentId: parent.id,
      });
      folderIds.push(created.id);

      expect(created).toMatchObject({
        name: `${marker} child`,
        parentId: parent.id,
      });

      const tree = await caller.getFolderTree();
      expect(findNode(tree, created.id)?.parentId).toBe(parent.id);
    });

    it("rejects a blank name", async () => {
      await expect(caller.createFolder({ name: "   " })).rejects.toThrow();
    });

    it("throws NOT_FOUND for an unknown parent", async () => {
      await expect(
        caller.createFolder({ name: "Orphan", parentId: randomUUID() }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateFolder", () => {
    it("renames a folder without moving it", async () => {
      const parent = await createFolder(`${marker} parent`);
      const folder = await createFolder(`${marker} old`, parent.id);

      const updated = await caller.updateFolder({
        id: folder.id,
        name: `${marker} new`,
      });

      expect(updated).toMatchObject({
        id: folder.id,
        name: `${marker} new`,
        parentId: parent.id,
      });
    });

    it("moves a folder under another folder", async () => {
      const from = await createFolder(`${marker} from`);
      const to = await createFolder(`${marker} to`);
      const folder = await createFolder(`${marker} moving`, from.id);

      const updated = await caller.updateFolder({
        id: folder.id,
        parentId: to.id,
      });

      expect(updated.parentId).toBe(to.id);

      const tree = await caller.getFolderTree();
      expect(findNode(tree, from.id)?.children).toEqual([]);
      expect(findNode(tree, to.id)?.children.map((node) => node.id)).toEqual([
        folder.id,
      ]);
    });

    it("refuses making a folder its own parent", async () => {
      const folder = await createFolder(`${marker} self`);

      await expect(
        caller.updateFolder({ id: folder.id, parentId: folder.id }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("refuses moving a folder inside one of its descendants", async () => {
      const root = await createFolder(`${marker} root`);
      const child = await createFolder(`${marker} child`, root.id);
      const grandchild = await createFolder(`${marker} grandchild`, child.id);

      await expect(
        caller.updateFolder({ id: root.id, parentId: grandchild.id }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      const tree = await caller.getFolderTree();
      expect(findNode(tree, root.id)?.parentId).toBeNull();
    });

    it("throws NOT_FOUND for an unknown folder", async () => {
      await expect(
        caller.updateFolder({ id: randomUUID(), name: "Nope" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("deleteFolder", () => {
    it("deletes an empty folder", async () => {
      const folder = await createFolder(`${marker} empty`);

      await expect(caller.deleteFolder({ id: folder.id })).resolves.toEqual({
        id: folder.id,
      });

      const index = folderIds.indexOf(folder.id);
      if (index >= 0) folderIds.splice(index, 1);

      const tree = await caller.getFolderTree();
      expect(findNode(tree, folder.id)).toBeNull();
    });

    it("refuses a folder that still contains a subfolder", async () => {
      const parent = await createFolder(`${marker} parent`);
      await createFolder(`${marker} child`, parent.id);

      await expect(
        caller.deleteFolder({ id: parent.id }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: expect.stringContaining("subfolder"),
      });

      // The service refuses with a readable message; the foreign key is the
      // backstop, so a caller that skipped the service still cannot strand it.
      await expect(
        db.mediaFolder.delete({ where: { id: parent.id } }),
      ).rejects.toBeDefined();

      const tree = await caller.getFolderTree();
      expect(findNode(tree, parent.id)).not.toBeNull();
    });

    it("refuses a folder that still contains Media", async () => {
      const folder = await createFolder(`${marker} full`);
      await createMediaInFolder(folder.id);

      await expect(
        caller.deleteFolder({ id: folder.id }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: expect.stringContaining("Media"),
      });

      const tree = await caller.getFolderTree();
      expect(findNode(tree, folder.id)).not.toBeNull();
    });

    it("throws NOT_FOUND for an unknown folder", async () => {
      await expect(
        caller.deleteFolder({ id: randomUUID() }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
