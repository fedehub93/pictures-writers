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

import {
  ContentStatus,
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { schedulerRouter } from "../server/procedures";

const createCaller = createCallerFactory(schedulerRouter);
const rootIds: string[] = [];
const scheduledActionIds: string[] = [];

async function createScheduledPost({
  plannedAt,
  status = ScheduledActionStatus.SCHEDULED,
  type = ScheduledActionType.PUBLISH_POST,
  title = `Post ${randomUUID()}`,
}: {
  plannedAt: Date;
  status?: ScheduledActionStatus;
  type?: ScheduledActionType;
  title?: string;
}) {
  const root = await db.postRoot.create({
    data: { slug: `post-${randomUUID()}` },
  });
  rootIds.push(root.id);

  const version = await db.postVersion.create({
    data: {
      rootId: root.id,
      version: 1,
      status: ContentStatus.DRAFT,
      title,
    },
  });

  await db.postRoot.update({
    where: { id: root.id },
    data: { currentVersionId: version.id },
  });

  const action = await db.scheduledAction.create({
    data: {
      type,
      targetType: "POST_ROOT",
      targetId: root.id,
      plannedAt,
      timezone: "Europe/Rome",
      status,
      idempotencyKey: randomUUID(),
    },
  });
  scheduledActionIds.push(action.id);

  return { rootId: root.id, actionId: action.id, title };
}

beforeEach(() => {
  rootIds.length = 0;
  scheduledActionIds.length = 0;
});

afterEach(async () => {
  if (scheduledActionIds.length > 0) {
    await db.scheduledAction.deleteMany({
      where: { id: { in: scheduledActionIds } },
    });
  }
  if (rootIds.length > 0) {
    await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
  }
  rootIds.length = 0;
  scheduledActionIds.length = 0;
});

describe("scheduler.getScheduled", () => {
  it("counts only future, active PUBLISH_POST actions and lists the soonest first", async () => {
    const now = Date.now();
    const soon = await createScheduledPost({
      plannedAt: new Date(now + 60_000),
      title: "Prossimo",
    });
    const later = await createScheduledPost({
      plannedAt: new Date(now + 3_600_000),
      title: "Più tardi",
    });
    // Past, terminal, and non-post actions are all excluded.
    await createScheduledPost({ plannedAt: new Date(now - 60_000) });
    await createScheduledPost({
      plannedAt: new Date(now + 60_000),
      status: ScheduledActionStatus.SUCCEEDED,
    });
    await createScheduledPost({
      plannedAt: new Date(now + 60_000),
      type: ScheduledActionType.SEND_EMAIL,
    });

    const result = await createCaller({ userId: "any-user" }).getScheduled();

    expect(result.count).toBe(2);
    expect(result.items.map((item) => item.actionId)).toEqual([
      soon.actionId,
      later.actionId,
    ]);
    expect(result.items.map((item) => item.title)).toEqual([
      "Prossimo",
      "Più tardi",
    ]);
    expect(result.items[0]?.rootId).toBe(soon.rootId);
  });
});
