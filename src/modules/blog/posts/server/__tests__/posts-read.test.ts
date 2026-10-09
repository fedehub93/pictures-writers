import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Swap the protected procedure for a plain one so the read round-trip can run
// without a session, exactly like the pages-read suite.
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

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { emptyTiptapDoc } from "../../lib/__tests__/fixtures";

import { postsRouter } from "../procedures";

const createCaller = createCallerFactory(postsRouter);

const rootIds: string[] = [];

let caller: ReturnType<typeof createCaller>;

beforeEach(() => {
  rootIds.length = 0;
  caller = createCaller({ userId: randomUUID(), auth: { id: randomUUID() } });
});

afterEach(async () => {
  if (rootIds.length > 0) {
    await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
    rootIds.length = 0;
  }
});

async function createRootVersion({
  title,
  status,
  version,
  authored = false,
}: {
  title: string;
  status: ContentStatus;
  version: number;
  authored?: boolean;
}) {
  const root = await db.postRoot.create({
    data: { slug: `post-${randomUUID()}` },
  });
  rootIds.push(root.id);

  const versionRow = await db.postVersion.create({
    data: {
      rootId: root.id,
      title,
      version,
      status,
      tiptapBodyData: emptyTiptapDoc,
      publishedAt: status === ContentStatus.PUBLISHED ? new Date() : null,
    },
  });

  const data: { currentVersionId: string; liveVersionId?: string } = {
    currentVersionId: versionRow.id,
  };
  if (status === ContentStatus.PUBLISHED) {
    data.liveVersionId = versionRow.id;
  }

  await db.postRoot.update({ where: { id: root.id }, data });

  if (authored) {
    const user = await db.user.create({
      data: { email: `author-${randomUUID()}@example.com` },
    });
    await db.postAuthor.create({
      data: { postId: versionRow.id, userId: user.id, sort: 0 },
    });
  }

  return { rootId: root.id, versionId: versionRow.id };
}

describe("postsRouter reads via PostRoot + PostVersion", () => {
  it("getOne returns the current version with its inherited slug", async () => {
    const { rootId, versionId } = await createRootVersion({
      title: "One",
      status: ContentStatus.DRAFT,
      version: 1,
    });

    const loaded = await caller.getOne({ id: rootId });

    expect(loaded.id).toBe(versionId);
    expect(loaded.rootId).toBe(rootId);
    expect(loaded.title).toBe("One");
    expect(loaded.slug).toMatch(/^post-/);
  });

  it("getLastByRootId returns the current version", async () => {
    const { rootId, versionId } = await createRootVersion({
      title: "Two",
      status: ContentStatus.CHANGED,
      version: 2,
    });

    const loaded = await caller.getLastByRootId({ rootId });

    expect(loaded.id).toBe(versionId);
    expect(loaded.status).toBe(ContentStatus.CHANGED);
  });

  it("getMany returns one row per root with unpublished first", async () => {
    const marker = `Marker ${randomUUID()}`;
    const live = await createRootVersion({
      title: `${marker} live`,
      status: ContentStatus.PUBLISHED,
      version: 1,
    });
    const draft = await createRootVersion({
      title: `${marker} draft`,
      status: ContentStatus.DRAFT,
      version: 1,
    });

    const result = await caller.getMany({
      page: 1,
      pageSize: 50,
      search: marker,
    });

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.items.map((item) => item.rootId)).toEqual([
      draft.rootId,
      live.rootId,
    ]);
  });

  it("getMany supports explicit title sorts", async () => {
    const marker = `Sort ${randomUUID()}`;
    await createRootVersion({
      title: `${marker} B`,
      status: ContentStatus.DRAFT,
      version: 1,
    });
    await createRootVersion({
      title: `${marker} A`,
      status: ContentStatus.DRAFT,
      version: 1,
    });

    const result = await caller.getMany({
      page: 1,
      pageSize: 50,
      search: marker,
      sort: "title",
      direction: "asc",
    });

    expect(result.items.map((item) => item.title)).toEqual([
      `${marker} A`,
      `${marker} B`,
    ]);
  });

  it("getMany supports explicit publishedAt sorts", async () => {
    const marker = `Pub ${randomUUID()}`;
    const older = await db.postRoot.create({
      data: { slug: `post-${randomUUID()}` },
    });
    rootIds.push(older.id);
    const olderVersion = await db.postVersion.create({
      data: {
        rootId: older.id,
        title: `${marker} older`,
        version: 1,
        status: ContentStatus.PUBLISHED,
        tiptapBodyData: emptyTiptapDoc,
        publishedAt: new Date("2024-01-01"),
      },
    });
    await db.postRoot.update({
      where: { id: older.id },
      data: {
        currentVersionId: olderVersion.id,
        liveVersionId: olderVersion.id,
      },
    });

    const newer = await createRootVersion({
      title: `${marker} newer`,
      status: ContentStatus.PUBLISHED,
      version: 1,
    });

    const result = await caller.getMany({
      page: 1,
      pageSize: 50,
      search: marker,
      sort: "publishedAt",
      direction: "desc",
    });

    expect(result.items[0]!.rootId).toBe(newer.rootId);
    expect(result.items[1]!.rootId).toBe(older.id);
  });

  it("getMany filters by the current version status", async () => {
    const marker = `Status ${randomUUID()}`;
    await createRootVersion({
      title: marker,
      status: ContentStatus.DRAFT,
      version: 1,
    });
    await createRootVersion({
      title: marker,
      status: ContentStatus.PUBLISHED,
      version: 1,
    });

    const drafts = await caller.getMany({
      page: 1,
      pageSize: 50,
      search: marker,
      status: ContentStatus.DRAFT,
    });

    expect(drafts.total).toBe(1);
    expect(drafts.items[0]!.status).toBe(ContentStatus.DRAFT);
  });

  it("getMany supports the remaining explicit sorts", async () => {
    const marker = `Sorts ${randomUUID()}`;
    const early = await createRootVersion({
      title: `${marker} early`,
      status: ContentStatus.DRAFT,
      version: 1,
    });
    const middle = await createRootVersion({
      title: `${marker} middle`,
      status: ContentStatus.DRAFT,
      version: 1,
    });
    const late = await createRootVersion({
      title: `${marker} late`,
      status: ContentStatus.CHANGED,
      version: 1,
    });

    // Set timestamps raw so `@updatedAt` doesn't overwrite them.
    await db.$executeRaw`
      UPDATE "PostVersion"
      SET "createdAt" = ${new Date("2024-01-01")},
          "updatedAt" = ${new Date("2024-03-01")},
          "scheduledAt" = ${new Date("2024-02-01")}
      WHERE "id" = ${early.versionId}`;
    await db.$executeRaw`
      UPDATE "PostVersion"
      SET "createdAt" = ${new Date("2024-01-02")},
          "updatedAt" = ${new Date("2024-02-01")},
          "scheduledAt" = NULL
      WHERE "id" = ${middle.versionId}`;
    await db.$executeRaw`
      UPDATE "PostVersion"
      SET "createdAt" = ${new Date("2024-01-03")},
          "updatedAt" = ${new Date("2024-01-01")},
          "scheduledAt" = ${new Date("2024-04-01")}
      WHERE "id" = ${late.versionId}`;

    const query = (
      sort: "createdAt" | "updatedAt" | "scheduledAt" | "status",
      direction: "asc" | "desc",
    ) =>
      caller.getMany({ page: 1, pageSize: 50, search: marker, sort, direction });

    const byCreatedAt = await query("createdAt", "desc");
    expect(byCreatedAt.items.map((item) => item.title)).toEqual([
      `${marker} late`,
      `${marker} middle`,
      `${marker} early`,
    ]);

    const byUpdatedAt = await query("updatedAt", "desc");
    expect(byUpdatedAt.items.map((item) => item.title)).toEqual([
      `${marker} early`,
      `${marker} middle`,
      `${marker} late`,
    ]);

    // `scheduledAt` pins nulls last, so the unscheduled post comes after.
    const byScheduledAt = await query("scheduledAt", "asc");
    expect(byScheduledAt.items.map((item) => item.title)).toEqual([
      `${marker} early`,
      `${marker} late`,
      `${marker} middle`,
    ]);

    const byStatus = await query("status", "asc");
    expect(byStatus.items.map((item) => item.status)).toEqual([
      ContentStatus.DRAFT,
      ContentStatus.DRAFT,
      ContentStatus.CHANGED,
    ]);
  });
});
