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
import { SCHEDULER_TARGET_TYPES } from "../constants";

const createCaller = createCallerFactory(schedulerRouter);
const rootIds: string[] = [];
const scheduledActionIds: string[] = [];
const emailIds: string[] = [];

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

async function createScheduledEmail({
  plannedAt,
  title = `Newsletter ${randomUUID()}`,
}: {
  plannedAt: Date;
  title?: string;
}) {
  const email = await db.emailSingleSend.create({ data: { name: title } });
  emailIds.push(email.id);

  const action = await db.scheduledAction.create({
    data: {
      type: ScheduledActionType.SEND_EMAIL,
      targetType: SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
      targetId: email.id,
      plannedAt,
      timezone: "Europe/Rome",
      status: ScheduledActionStatus.SCHEDULED,
      idempotencyKey: randomUUID(),
    },
  });
  scheduledActionIds.push(action.id);

  return { emailId: email.id, actionId: action.id, title };
}

beforeEach(() => {
  rootIds.length = 0;
  scheduledActionIds.length = 0;
  emailIds.length = 0;
});

afterEach(async () => {
  if (scheduledActionIds.length > 0) {
    await db.scheduledAction.deleteMany({
      where: { id: { in: scheduledActionIds } },
    });
  }
  if (emailIds.length > 0) {
    await db.emailSingleSend.deleteMany({ where: { id: { in: emailIds } } });
  }
  if (rootIds.length > 0) {
    await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
  }
  rootIds.length = 0;
  scheduledActionIds.length = 0;
  emailIds.length = 0;
});

describe("scheduler.getScheduled", () => {
  it("lists every future, active action and filters by type", async () => {
    const now = Date.now();
    const soon = await createScheduledPost({
      plannedAt: new Date(now + 60_000),
      title: "Prossimo",
    });
    const email = await createScheduledEmail({
      plannedAt: new Date(now + 120_000),
      title: "Newsletter",
    });
    const later = await createScheduledPost({
      plannedAt: new Date(now + 3_600_000),
      title: "Più tardi",
    });
    // Past and terminal actions are excluded.
    await createScheduledPost({ plannedAt: new Date(now - 60_000) });
    await createScheduledPost({
      plannedAt: new Date(now + 60_000),
      status: ScheduledActionStatus.SUCCEEDED,
    });

    const all = await createCaller({ userId: "any-user" }).getScheduled();

    expect(all.count).toBe(3);
    expect(all.items.map((item) => item.actionId)).toEqual([
      soon.actionId,
      email.actionId,
      later.actionId,
    ]);
    expect(all.items.map((item) => item.title)).toEqual([
      "Prossimo",
      "Newsletter",
      "Più tardi",
    ]);
    expect(all.items[0]?.targetId).toBe(soon.rootId);
    expect(all.items[1]?.type).toBe(ScheduledActionType.SEND_EMAIL);

    const postsOnly = await createCaller({ userId: "any-user" }).getScheduled({
      types: [ScheduledActionType.PUBLISH_POST],
    });

    expect(postsOnly.count).toBe(2);
    expect(postsOnly.items.map((item) => item.actionId)).toEqual([
      soon.actionId,
      later.actionId,
    ]);
  });
});
