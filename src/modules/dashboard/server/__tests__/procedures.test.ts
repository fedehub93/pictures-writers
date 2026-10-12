import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the round-trip can be
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

import { createCallerFactory } from "@/trpc/init";

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS, getProcedurePermissions } from "@/shared/lib/permissions";

import { dashboardRouter } from "../procedures";

const createCaller = createCallerFactory(dashboardRouter);

const userIds: string[] = [];
const rootIds: string[] = [];

async function createUser() {
  const user = await db.user.create({
    data: { email: `dashboard-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  return user;
}

function callerFor(userId: string) {
  return createCaller({ userId, auth: { id: userId } });
}

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
  userIds.length = 0;
  rootIds.length = 0;
});

afterEach(async () => {
  if (rootIds.length > 0) {
    await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
  }
  if (userIds.length > 0) {
    await db.dashboardLayout.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  userIds.length = 0;
  rootIds.length = 0;
});

describe("dashboard.getLayout", () => {
  it("returns an empty layout for a user who has never saved one", async () => {
    const user = await createUser();

    const layout = await callerFor(user.id).getLayout();

    expect(layout).toEqual({ widgets: [] });
  });
});

describe("dashboard.saveLayout", () => {
  it("round-trips the saved instances for the current user", async () => {
    const user = await createUser();
    const caller = callerFor(user.id);
    const widgets = [
      { key: "drafts", definitionId: "drafts" },
      { key: "trend-contacts", definitionId: "trend", config: { metric: "contacts" } },
    ];

    await caller.saveLayout({ widgets });
    const layout = await caller.getLayout();

    expect(layout.widgets).toEqual(widgets);
  });

  it("replaces the previous layout on a second save", async () => {
    const user = await createUser();
    const caller = callerFor(user.id);

    await caller.saveLayout({ widgets: [{ key: "drafts", definitionId: "drafts" }] });
    await caller.saveLayout({
      widgets: [{ key: "drafts", definitionId: "drafts", hidden: true }],
    });

    const layout = await caller.getLayout();

    expect(layout.widgets).toEqual([
      { key: "drafts", definitionId: "drafts", hidden: true },
    ]);
  });

  it("never affects another user's layout", async () => {
    const owner = await createUser();
    const other = await createUser();

    await callerFor(owner.id).saveLayout({
      widgets: [{ key: "drafts", definitionId: "drafts" }],
    });

    const otherLayout = await callerFor(other.id).getLayout();
    const ownerLayout = await callerFor(owner.id).getLayout();

    expect(otherLayout).toEqual({ widgets: [] });
    expect(ownerLayout.widgets).toHaveLength(1);
  });

  it("gates both layout procedures behind dashboard.read", () => {
    expect(getProcedurePermissions("dashboard.getLayout")).toEqual([
      PERMISSIONS.DASHBOARD_READ,
    ]);
    expect(getProcedurePermissions("dashboard.saveLayout")).toEqual([
      PERMISSIONS.DASHBOARD_READ,
    ]);
  });
});

describe("dashboard.getDrafts", () => {
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

    const result = await callerFor("any-user").getDrafts();

    expect(result.count).toBe(2);
    expect(result.items.map((item) => item.rootId)).toEqual([
      newer.rootId,
      older.rootId,
    ]);
  });
});
