import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedures for plain ones so the round-trip can be
// exercised against the test database without a session.
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

const storage = vi.hoisted(() => ({
  driver: undefined as StorageDriver | undefined,
}));

// `removeMany` resolves the storage driver through this module. Pointing it at
// a temporary local root keeps permanent deletion off the network while still
// asserting that the objects disappear with the row.
vi.mock("@/modules/media/server/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/media/server/storage")>()),
  resolveActiveStorageDriver: async () => ({
    driver: storage.driver,
    name: "local" as const,
  }),
}));

import { createCallerFactory } from "@/trpc/init";

import { MediaType, type Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import type { StorageDriver } from "@/modules/media/server/storage/types";

import { mediaRouter } from "../procedures";

const createCaller = createCallerFactory(mediaRouter);

const mediaIds: string[] = [];
const postRootIds: string[] = [];

let caller: ReturnType<typeof createCaller>;
let root: string;
let driver: StorageDriver;

beforeEach(async () => {
  mediaIds.length = 0;
  postRootIds.length = 0;

  root = await mkdtemp(path.join(tmpdir(), "media-router-"));
  driver = createLocalStorageDriver({ root });
  storage.driver = driver;

  caller = createCaller({ userId: "media-router-test", auth: { id: "media-router-test" } });
});

afterEach(async () => {
  if (postRootIds.length > 0) {
    await db.postRoot.deleteMany({ where: { id: { in: postRootIds } } });
  }
  if (mediaIds.length > 0) {
    await db.media.deleteMany({ where: { id: { in: mediaIds } } });
  }
  await rm(root, { recursive: true, force: true });

  mediaIds.length = 0;
  postRootIds.length = 0;
  storage.driver = undefined;
});

async function createMedia(
  overrides: Partial<Prisma.MediaUncheckedCreateInput> = {},
) {
  const id = overrides.id ?? randomUUID();
  const media = await db.media.create({
    data: {
      id,
      name: `Media ${randomUUID()}`,
      url: `/media/test/${randomUUID()}/original`,
      type: MediaType.IMAGE,
      size: 128,
      ...overrides,
    },
  });

  mediaIds.push(media.id);
  return media;
}

async function createReferencingPost(mediaId: string) {
  const root = await db.postRoot.create({
    data: { slug: `post-${randomUUID()}` },
  });
  postRootIds.push(root.id);

  const version = await db.postVersion.create({
    data: {
      rootId: root.id,
      version: 1,
      title: `Post ${randomUUID()}`,
      imageCoverId: mediaId,
    },
  });

  return version;
}

describe("mediaRouter", () => {
  describe("getMany", () => {
    it("reads the storage facts from the stored-file record", async () => {
      const media = await createMedia({
        name: `Record ${randomUUID()}`,
        key: "mirror/original",
        url: "/media/mirror/original",
        size: 10,
        mimeType: "image/jpeg",
        checksum: "mirror-checksum",
      });
      await db.storedFile.create({
        data: {
          mediaId: media.id,
          key: `default/${media.id}/1/original`,
          driver: "local",
          contentType: "image/png",
          size: 4242,
          checksum: "record-checksum",
        },
      });

      const result = await caller.getMany({ search: media.name });
      const item = result.items.find((entry) => entry.id === media.id);

      expect(item).toMatchObject({
        key: `default/${media.id}/1/original`,
        url: "/media/mirror/original",
        size: 4242,
        mimeType: "image/png",
        checksum: "record-checksum",
        storageDriver: "local",
      });
      expect(item).not.toHaveProperty("storedFile");
    });

    it("falls back to the Media's own columns before the record exists", async () => {
      const media = await createMedia({
        name: `No record ${randomUUID()}`,
        size: 321,
        mimeType: "image/webp",
        checksum: "media-checksum",
      });

      const result = await caller.getMany({ search: media.name });

      expect(result.items[0]).toMatchObject({
        size: 321,
        mimeType: "image/webp",
        checksum: "media-checksum",
      });
    });

    it("defaults to page 1 with eight items", async () => {
      const marker = `Defaults ${randomUUID()}`;
      for (let index = 0; index < 9; index += 1) {
        await createMedia({ name: `${marker} ${index}` });
      }

      const result = await caller.getMany({ search: marker });

      expect(result.total).toBe(9);
      expect(result.totalPages).toBe(2);
      expect(result.items).toHaveLength(8);
    });

    it("returns the pagination envelope and the second page contents", async () => {
      const marker = `Paginated ${randomUUID()}`;
      const base = Date.now();
      const older = await createMedia({
        name: `${marker} older`,
        createdAt: new Date(base - 3000),
      });
      const middle = await createMedia({
        name: `${marker} middle`,
        createdAt: new Date(base - 2000),
      });
      const newer = await createMedia({
        name: `${marker} newer`,
        createdAt: new Date(base - 1000),
      });

      const first = await caller.getMany({
        page: 1,
        pageSize: 2,
        search: marker,
      });
      expect(first.total).toBe(3);
      expect(first.totalPages).toBe(2);
      expect(first.items.map((item) => item.id)).toEqual([
        newer.id,
        middle.id,
      ]);

      const second = await caller.getMany({
        page: 2,
        pageSize: 2,
        search: marker,
      });
      expect(second.total).toBe(3);
      expect(second.totalPages).toBe(2);
      expect(second.items.map((item) => item.id)).toEqual([older.id]);
    });

    it("searches by name without distinguishing case", async () => {
      const marker = `MiXeD CaSe ${randomUUID()}`;
      const match = await createMedia({ name: `Photo ${marker}` });
      await createMedia({ name: `Unrelated ${randomUUID()}` });

      const result = await caller.getMany({
        search: marker.toLowerCase(),
      });

      expect(result.total).toBe(1);
      expect(result.items[0]!.id).toBe(match.id);
    });

    it("filters by the active or archived view", async () => {
      const marker = `View ${randomUUID()}`;
      const active = await createMedia({ name: `${marker} active` });
      const archived = await createMedia({
        name: `${marker} archived`,
        archivedAt: new Date(),
      });

      const library = await caller.getMany({ search: marker });
      expect(library.items.map((item) => item.id)).toEqual([active.id]);

      const archivedView = await caller.getMany({
        search: marker,
        view: "archived",
      });
      expect(archivedView.items.map((item) => item.id)).toEqual([
        archived.id,
      ]);
    });

    it("orders by createdAt descending with the id as tiebreaker", async () => {
      const marker = `Order ${randomUUID()}`;
      const createdAt = new Date("2025-01-01T00:00:00.000Z");
      const prefix = `order-${randomUUID()}`;
      const alpha = await createMedia({
        id: `${prefix}-a`,
        name: `${marker} alpha`,
        createdAt,
      });
      const beta = await createMedia({
        id: `${prefix}-b`,
        name: `${marker} beta`,
        createdAt,
      });
      const gamma = await createMedia({
        id: `${prefix}-c`,
        name: `${marker} gamma`,
        createdAt,
      });

      const result = await caller.getMany({ search: marker, pageSize: 10 });

      expect(result.items.map((item) => item.id)).toEqual([
        alpha.id,
        beta.id,
        gamma.id,
      ]);
    });

    it("counts the relational references of every item", async () => {
      const marker = `Usage ${randomUUID()}`;
      const used = await createMedia({ name: `${marker} used` });
      const unused = await createMedia({ name: `${marker} unused` });
      await createReferencingPost(used.id);

      const result = await caller.getMany({ search: marker, pageSize: 10 });
      const counts = new Map(
        result.items.map((item) => [item.id, item.usageCount]),
      );

      expect(counts.get(used.id)).toBe(1);
      expect(counts.get(unused.id)).toBe(0);
    });

    it("rejects a page size above the limit", async () => {
      await expect(caller.getMany({ pageSize: 101 })).rejects.toThrow();
    });
  });

  describe("getMeta", () => {
    it("counts with the grid filters and reports quota and storage", async () => {
      const marker = `Meta ${randomUUID()}`;
      await createMedia({ name: `${marker} one` });
      await createMedia({ name: `${marker} two` });
      await createMedia({
        name: `${marker} archived`,
        archivedAt: new Date(),
      });

      const grid = await caller.getMany({ search: marker });
      const meta = await caller.getMeta({ search: marker });

      expect(meta.total).toBe(grid.total);
      expect(meta.total).toBe(2);
      expect(meta.quota.usedBytes).toBeGreaterThanOrEqual(0);
      expect(meta.quota.totalBytes).toBeGreaterThan(0);
      expect(meta.quota.percent).toBeGreaterThanOrEqual(0);
      expect(["local", "uploadthing"]).toContain(meta.storage.active);
      expect(typeof meta.storage.uploadThingAvailable).toBe("boolean");

      const archivedMeta = await caller.getMeta({
        search: marker,
        view: "archived",
      });
      expect(archivedMeta.total).toBe(1);
    });
  });

  describe("update", () => {
    it("changes only the name and the alt text", async () => {
      const media = await createMedia({
        name: `Original ${randomUUID()}`,
        altText: "Original alt text",
        checksum: `checksum-${randomUUID()}`,
        revision: 3,
      });
      const before = await db.media.findUniqueOrThrow({
        where: { id: media.id },
      });

      // The extra keys are what the old mass-assignment update would have
      // written. The procedure must ignore them.
      const input = {
        id: media.id,
        name: "Renamed media",
        altText: "Updated alt text",
        url: "/media/hijacked",
        archivedAt: new Date(),
      } as { id: string; name: string; altText: string | null };

      const updated = await caller.update(input);
      expect(updated.name).toBe("Renamed media");
      expect(updated.altText).toBe("Updated alt text");

      const after = await db.media.findUniqueOrThrow({
        where: { id: media.id },
      });
      expect(after).toMatchObject({
        id: before.id,
        key: before.key,
        url: before.url,
        size: before.size,
        type: before.type,
        mimeType: before.mimeType,
        checksum: before.checksum,
        revision: before.revision,
        storageDriver: before.storageDriver,
        metadata: before.metadata,
        renditions: before.renditions,
        archivedAt: before.archivedAt,
        createdAt: before.createdAt,
      });
    });

    it("throws NOT_FOUND for an unknown Media", async () => {
      await expect(
        caller.update({ id: randomUUID(), name: "Nope" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("archive and restore", () => {
    it("archives a list idempotently and moves the Media to the archived view", async () => {
      const marker = `Archive ${randomUUID()}`;
      const active = await createMedia({ name: `${marker} active` });
      const alreadyArchived = await createMedia({
        name: `${marker} archived`,
        archivedAt: new Date(),
      });

      expect(await caller.archive({ ids: [active.id] })).toBe(1);
      expect(await caller.archive({ ids: [active.id] })).toBe(0);
      expect(await caller.archive({ ids: [alreadyArchived.id] })).toBe(0);

      const library = await caller.getMany({ search: marker });
      expect(library.total).toBe(0);

      const archivedView = await caller.getMany({
        search: marker,
        view: "archived",
      });
      expect(archivedView.items.map((item) => item.id).sort()).toEqual(
        [active.id, alreadyArchived.id].sort(),
      );
    });

    it("restores a list idempotently and returns the Media to the library", async () => {
      const marker = `Restore ${randomUUID()}`;
      const archived = await createMedia({
        name: `${marker} archived`,
        archivedAt: new Date(),
      });
      const active = await createMedia({ name: `${marker} active` });

      expect(await caller.restore({ ids: [archived.id] })).toBe(1);
      expect(await caller.restore({ ids: [archived.id] })).toBe(0);
      expect(await caller.restore({ ids: [active.id] })).toBe(0);

      const library = await caller.getMany({ search: marker });
      expect(library.items.map((item) => item.id).sort()).toEqual(
        [archived.id, active.id].sort(),
      );
    });

    it("throws NOT_FOUND for an unknown Media", async () => {
      await expect(
        caller.archive({ ids: [randomUUID()] }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(
        caller.restore({ ids: [randomUUID()] }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("removeMany", () => {
    it("refuses an active Media", async () => {
      const media = await createMedia();

      await expect(
        caller.removeMany({ ids: [media.id] }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: expect.stringContaining("archived"),
      });

      await expect(
        db.media.findUnique({ where: { id: media.id } }),
      ).resolves.not.toBeNull();
    });

    it("refuses a referenced Media and names the blocking reference count", async () => {
      const media = await createMedia({ archivedAt: new Date() });
      await createReferencingPost(media.id);

      await expect(
        caller.removeMany({ ids: [media.id] }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: expect.stringContaining("1 content"),
      });

      await expect(
        db.media.findUnique({ where: { id: media.id } }),
      ).resolves.not.toBeNull();
    });

    it("deletes the rows and the storage prefix when the Media is archived and unreferenced", async () => {
      const media = await createMedia({
        archivedAt: new Date(),
        storageDriver: "local",
      });
      const key = `default/${media.id}/1/original`;
      await db.media.update({
        where: { id: media.id },
        data: { key, url: `/media/${key}` },
      });
      await driver.put(key, new Uint8Array([1, 2, 3]), "image/png");

      expect(await caller.removeMany({ ids: [media.id] })).toMatchObject({
        deleted: 1,
        cleanup: [{ mediaId: media.id, status: "removed" }],
      });

      await expect(
        db.media.findUnique({ where: { id: media.id } }),
      ).resolves.toBeNull();
      await expect(driver.get(key)).rejects.toBeDefined();
    });

    it("throws NOT_FOUND for an unknown Media", async () => {
      await expect(
        caller.removeMany({ ids: [randomUUID()] }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
