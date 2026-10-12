import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { postsRouter } from "../procedures";

const createCaller = createCallerFactory(postsRouter);
const rootIds: string[] = [];

async function createPost(status: ContentStatus, updatedAt: Date) {
  const root = await db.postRoot.create({
    data: { slug: `post-${randomUUID()}` },
  });
  rootIds.push(root.id);

  const version = await db.postVersion.create({
    data: {
      rootId: root.id,
      version: 1,
      status,
      title: `Post ${randomUUID()}`,
      updatedAt,
    },
  });

  await db.postRoot.update({
    where: { id: root.id },
    data: { currentVersionId: version.id },
  });

  return { rootId: root.id, versionId: version.id };
}

beforeEach(() => {
  rootIds.length = 0;
});

afterEach(async () => {
  if (rootIds.length > 0) {
    await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
  }
  rootIds.length = 0;
});

describe("posts.getDrafts", () => {
  it("counts every draft post and lists the most recently edited first", async () => {
    const older = await createPost(
      ContentStatus.DRAFT,
      new Date("2026-01-01T00:00:00.000Z"),
    );
    const newer = await createPost(
      ContentStatus.DRAFT,
      new Date("2026-02-01T00:00:00.000Z"),
    );
    await createPost(
      ContentStatus.PUBLISHED,
      new Date("2026-03-01T00:00:00.000Z"),
    );

    const result = await createCaller({ userId: "any-user" }).getDrafts();

    expect(result.count).toBe(2);
    expect(result.items.map((item) => item.rootId)).toEqual([
      newer.rootId,
      older.rootId,
    ]);
  });
});
