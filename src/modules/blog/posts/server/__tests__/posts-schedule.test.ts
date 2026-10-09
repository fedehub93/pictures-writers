import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Swap the permission procedure for a plain one so the scheduling round-trip
// can be exercised against the test database without a session, exactly like
// the other posts-router suites.
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

import {
  ContentStatus,
  ScheduledActionStatus,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { postsRouter } from "../procedures";

const createCaller = createCallerFactory(postsRouter);

const rootIds: string[] = [];
const userIds: string[] = [];

let caller: ReturnType<typeof createCaller>;

beforeEach(async () => {
  rootIds.length = 0;
  userIds.length = 0;

  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

afterEach(async () => {
  if (rootIds.length > 0) {
    await db.scheduledAction.deleteMany({
      where: { targetId: { in: rootIds } },
    });
    const versions = await db.postVersion.findMany({
      where: { rootId: { in: rootIds } },
      select: { seoId: true },
    });
    const seoIds = [
      ...new Set(
        versions
          .map((version) => version.seoId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
    if (seoIds.length > 0) {
      await db.seo.deleteMany({ where: { id: { in: seoIds } } });
    }
  }
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  rootIds.length = 0;
  userIds.length = 0;
});

async function createPost() {
  const created = await caller.create({
    title: `Post ${randomUUID()}`,
    slug: `post-${randomUUID()}`,
  });
  rootIds.push(created.rootId);
  return created;
}

const future = () => new Date(Date.now() + 60 * 60 * 1000);

describe("postsRouter schedule", () => {
  it("schedules the current version and targets the root", async () => {
    const created = await createPost();

    const scheduled = await caller.schedule({
      id: created.id,
      rootId: created.rootId,
      scheduledAt: future(),
    });

    expect(scheduled.status).toBe(ContentStatus.SCHEDULED);
    expect(scheduled.preSchedulingStatus).toBe(ContentStatus.DRAFT);

    const action = await db.scheduledAction.findFirstOrThrow({
      where: { targetId: created.rootId },
    });
    expect(action.type).toBe("PUBLISH_POST");
    expect(action.targetType).toBe("POST_ROOT");
    expect(action.status).toBe(ScheduledActionStatus.SCHEDULED);
  });

  it("reschedules the current version and its action", async () => {
    const created = await createPost();
    await caller.schedule({
      id: created.id,
      rootId: created.rootId,
      scheduledAt: future(),
    });

    const next = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const rescheduled = await caller.reschedule({
      id: created.id,
      rootId: created.rootId,
      scheduledAt: next,
    });

    expect(rescheduled.status).toBe(ContentStatus.SCHEDULED);
    expect(rescheduled.scheduledAt?.toISOString()).toBe(next.toISOString());

    const action = await db.scheduledAction.findFirstOrThrow({
      where: { targetId: created.rootId },
    });
    expect(action.plannedAt.toISOString()).toBe(next.toISOString());
  });

  it("cancels the schedule and restores the previous status", async () => {
    const created = await createPost();
    await caller.schedule({
      id: created.id,
      rootId: created.rootId,
      scheduledAt: future(),
    });

    const cancelled = await caller.cancelSchedule({
      id: created.id,
      rootId: created.rootId,
    });

    expect(cancelled.status).toBe(ContentStatus.DRAFT);
    expect(cancelled.scheduledAt).toBeNull();
    expect(cancelled.preSchedulingStatus).toBeNull();

    const action = await db.scheduledAction.findFirstOrThrow({
      where: { targetId: created.rootId },
    });
    expect(action.status).toBe(ScheduledActionStatus.CANCELED);
  });

  it("rejects scheduling a version that is not the root's current one", async () => {
    const created = await createPost();
    const other = await caller.create({
      title: `Other ${randomUUID()}`,
      slug: `post-${randomUUID()}`,
    });
    rootIds.push(other.rootId);

    await expect(
      caller.schedule({
        id: other.id,
        rootId: created.rootId,
        scheduledAt: future(),
      }),
    ).rejects.toThrow();

    const action = await db.scheduledAction.findFirst({
      where: { targetId: created.rootId },
    });
    expect(action).toBeNull();
  });
});
