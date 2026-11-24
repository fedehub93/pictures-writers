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

import { MediaType, type Prisma } from "@/generated/prisma";
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

async function createMediaInFolder(
  folderId: string | null,
  overrides: Partial<Prisma.MediaUncheckedCreateInput> = {},
) {
  const media = await db.media.create({
    data: {
      type: MediaType.FILE,
      ...overrides,
      // The marker keeps a search term isolating this test from the rows other
      // test files hold in the same disposable database.
      name: overrides.name ?? `${marker} ${randomUUID()}`,
      folderId,
    },
  });
  mediaIds.push(media.id);
  return media;
}

/** A handed folder Media with the stored-file record its size comes from. */
async function createStoredMediaInFolder(
  folderId: string,
  size: number,
  overrides: Partial<Prisma.MediaUncheckedCreateInput> = {},
) {
  const id = overrides.id ?? randomUUID();
  const media = await db.media.create({
    data: {
      id,
      type: MediaType.FILE,
      ...overrides,
      name: overrides.name ?? `${marker} ${randomUUID()}`,
      folderId,
      storedFile: {
        create: {
          key: `folder-details/${id}/1/original`,
          driver: "local",
          contentType: "application/pdf",
          size,
          checksum: `checksum-${id}`,
        },
      },
    },
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

  describe("getFolderDetails", () => {
    it("counts and sizes the active Media filed directly in the folder", async () => {
      const folder = await createFolder(`${marker} details`);
      const other = await createFolder(`${marker} other`);

      await createStoredMediaInFolder(folder.id, 1000);
      await createStoredMediaInFolder(folder.id, 2500);
      await createStoredMediaInFolder(folder.id, 9999, {
        archivedAt: new Date(),
      });
      await createStoredMediaInFolder(other.id, 777);

      const details = await caller.getFolderDetails({ id: folder.id });

      expect(details).toMatchObject({
        id: folder.id,
        name: `${marker} details`,
        parentId: null,
        mediaCount: 2,
        totalSize: 3500,
      });
      // The dates are the stored rows, not the read's own clock.
      expect(details?.createdAt.getTime()).toBe(folder.createdAt.getTime());
      expect(details?.updatedAt.getTime()).toBe(folder.updatedAt.getTime());
    });

    it("reports an empty folder as zero items and zero bytes", async () => {
      const folder = await createFolder(`${marker} empty details`);

      await expect(
        caller.getFolderDetails({ id: folder.id }),
      ).resolves.toMatchObject({ mediaCount: 0, totalSize: 0 });
    });

    it("answers null for a folder that no longer exists", async () => {
      await expect(
        caller.getFolderDetails({ id: randomUUID() }),
      ).resolves.toBeNull();
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

  describe("moveMedia", () => {
    it("files one Media into the chosen folder", async () => {
      const folder = await createFolder(`${marker} target`);
      const media = await createMediaInFolder(null);

      await expect(
        caller.moveMedia({ ids: [media.id], folderId: folder.id }),
      ).resolves.toEqual({ moved: 1 });

      const row = await db.media.findUnique({
        where: { id: media.id },
        select: { folderId: true },
      });
      expect(row?.folderId).toBe(folder.id);
    });

    it("moves several Media at once and back to the My Drive root", async () => {
      const folder = await createFolder(`${marker} target`);
      const first = await createMediaInFolder(null);
      const second = await createMediaInFolder(null);

      await expect(
        caller.moveMedia({
          ids: [first.id, second.id],
          folderId: folder.id,
        }),
      ).resolves.toEqual({ moved: 2 });

      const filed = await db.media.findMany({
        where: { id: { in: [first.id, second.id] } },
        select: { folderId: true },
      });
      expect(filed.map((row) => row.folderId)).toEqual([
        folder.id,
        folder.id,
      ]);

      await expect(
        caller.moveMedia({ ids: [first.id, second.id], folderId: null }),
      ).resolves.toEqual({ moved: 2 });

      const unfiled = await db.media.findMany({
        where: { id: { in: [first.id, second.id] } },
        select: { folderId: true },
      });
      expect(unfiled.map((row) => row.folderId)).toEqual([null, null]);
    });

    it("refuses a target folder that does not exist", async () => {
      const media = await createMediaInFolder(null);

      await expect(
        caller.moveMedia({ ids: [media.id], folderId: randomUUID() }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      const row = await db.media.findUnique({
        where: { id: media.id },
        select: { folderId: true },
      });
      expect(row?.folderId).toBeNull();
    });

    it("files nothing when one Media in the batch is unknown", async () => {
      const folder = await createFolder(`${marker} target`);
      const media = await createMediaInFolder(null);

      await expect(
        caller.moveMedia({
          ids: [media.id, randomUUID()],
          folderId: folder.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      const row = await db.media.findUnique({
        where: { id: media.id },
        select: { folderId: true },
      });
      expect(row?.folderId).toBeNull();
    });
  });

  describe("folder-scoped reads", () => {
    it("lists only the Media filed directly in the open folder", async () => {
      const open = await createFolder(`${marker} open`);
      const other = await createFolder(`${marker} other`);
      const inside = await createMediaInFolder(open.id);
      await createMediaInFolder(other.id);
      await createMediaInFolder(null);

      const result = await caller.getMany({
        view: "active",
        folderId: open.id,
        pageSize: 100,
      });

      expect(result.items.map((item) => item.id)).toEqual([inside.id]);
      expect(result.total).toBe(1);
    });

    it("lists the unfiled Media at the My Drive root", async () => {
      const folder = await createFolder(`${marker} folder`);
      const unfiled = await createMediaInFolder(null);
      const filed = await createMediaInFolder(folder.id);

      const root = await caller.getMany({
        view: "active",
        folderId: null,
        pageSize: 100,
      });
      const omitted = await caller.getMany({
        view: "active",
        pageSize: 100,
      });
      const ids = root.items.map((item) => item.id);

      expect(ids).toContain(unfiled.id);
      expect(ids).not.toContain(filed.id);
      // Leaving the folder out of the input means the same scope as the root.
      expect(omitted.items.map((item) => item.id)).toContain(unfiled.id);
      expect(omitted.items.map((item) => item.id)).not.toContain(filed.id);
    });

    it("searches the whole library while browsing a folder", async () => {
      const folder = await createFolder(`${marker} folder`);
      const filed = await createMediaInFolder(folder.id);
      const unfiled = await createMediaInFolder(null);

      const result = await caller.getMany({
        view: "active",
        folderId: folder.id,
        search: marker,
      });

      // A name is often all the editor remembers; the open folder must not
      // hide the copy filed elsewhere.
      expect(result.items.map((item) => item.id).sort()).toEqual(
        [filed.id, unfiled.id].sort(),
      );
    });

    it("lists every active Media in the Recent view, newest first", async () => {
      const folder = await createFolder(`${marker} folder`);
      const base = Date.now();
      const older = await createMediaInFolder(null, {
        createdAt: new Date(base - 3000),
      });
      const newer = await createMediaInFolder(folder.id, {
        createdAt: new Date(base - 2000),
      });
      await createMediaInFolder(folder.id, {
        createdAt: new Date(base - 1000),
        archivedAt: new Date(),
      });

      const recent = await caller.getMany({
        view: "recent",
        folderId: folder.id,
        search: marker,
      });

      expect(recent.items.map((item) => item.id)).toEqual([
        newer.id,
        older.id,
      ]);
      expect(recent.folders).toEqual([]);
    });

    it("lists archived Media from every folder in the Archived view", async () => {
      const folder = await createFolder(`${marker} folder`);
      const filed = await createMediaInFolder(folder.id, {
        archivedAt: new Date(),
      });
      const unfiled = await createMediaInFolder(null, {
        archivedAt: new Date(),
      });

      const result = await caller.getMany({
        view: "archived",
        folderId: folder.id,
        search: marker,
      });

      expect(result.items.map((item) => item.id).sort()).toEqual(
        [filed.id, unfiled.id].sort(),
      );
      expect(result.items.every((item) => item.archivedAt !== null)).toBe(true);
      expect(result.folders).toEqual([]);
    });

    it("returns the open folder's subfolders with their active item counts", async () => {
      const parent = await createFolder(`${marker} parent`);
      const beta = await createFolder(`${marker} beta`, parent.id);
      const alpha = await createFolder(`${marker} alpha`, parent.id);
      const grandchild = await createFolder(`${marker} grandchild`, alpha.id);
      await createMediaInFolder(alpha.id);
      await createMediaInFolder(alpha.id, { archivedAt: new Date() });
      await createMediaInFolder(beta.id);

      const contents = await caller.getMany({
        view: "active",
        folderId: parent.id,
      });

      expect(contents.items).toEqual([]);
      expect(contents.folders.map((folder) => folder.name)).toEqual([
        `${marker} alpha`,
        `${marker} beta`,
      ]);
      // Archived Media do not count: the number is the rows the folder shows.
      expect(contents.folders.map((folder) => folder.mediaCount)).toEqual([
        1, 1,
      ]);

      const root = await caller.getMany({
        view: "active",
        folderId: null,
      });
      const roots = root.folders.filter((folder) =>
        folder.name.startsWith(marker),
      );

      // A root listing names the top-level folder and no descendant.
      expect(roots.map((folder) => folder.id)).toEqual([parent.id]);
      expect(roots.map((folder) => folder.id)).not.toContain(grandchild.id);
    });

    it("shows folder cards on the first page of a folder only", async () => {
      const parent = await createFolder(`${marker} parent`);
      await createFolder(`${marker} child`, parent.id);
      for (let index = 0; index < 3; index += 1) {
        await createMediaInFolder(parent.id);
      }

      const first = await caller.getMany({
        view: "active",
        folderId: parent.id,
        pageSize: 2,
        page: 1,
      });
      const second = await caller.getMany({
        view: "active",
        folderId: parent.id,
        pageSize: 2,
        page: 2,
      });

      expect(first.folders.map((folder) => folder.name)).toEqual([
        `${marker} child`,
      ]);
      expect(second.folders).toEqual([]);
      expect(second.items).toHaveLength(1);
    });

    it("shows no folder cards while a search term is active", async () => {
      const parent = await createFolder(`${marker} parent`);
      await createFolder(`${marker} child`, parent.id);

      const result = await caller.getMany({
        view: "active",
        folderId: parent.id,
        search: marker,
      });

      expect(result.folders).toEqual([]);
    });

    it("counts the open folder or the Recent scope in getMeta", async () => {
      const folder = await createFolder(`${marker} folder`);
      await createMediaInFolder(folder.id);
      await createMediaInFolder(folder.id);
      await createMediaInFolder(null);
      await createMediaInFolder(folder.id, { archivedAt: new Date() });

      const folderMeta = await caller.getMeta({
        view: "active",
        folderId: folder.id,
      });
      expect(folderMeta.total).toBe(2);

      const recentMeta = await caller.getMeta({
        view: "recent",
        search: marker,
      });
      expect(recentMeta.total).toBe(3);

      const archivedMeta = await caller.getMeta({
        view: "archived",
        search: marker,
      });
      expect(archivedMeta.total).toBe(1);
    });
  });
});
