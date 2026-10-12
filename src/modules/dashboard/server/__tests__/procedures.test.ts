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

import {
  AutomationRunStatus,
  ContentStatus,
  OrderStatus,
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS, getProcedurePermissions } from "@/shared/lib/permissions";
import { createProductRoot } from "@/modules/shop/products/lib/__tests__/root-fixtures";

import type { WidgetDefinition } from "../../types";
import {
  computeDashboardLayout,
  visibleDashboardWidgets,
} from "../layout";
import { dashboardRouter } from "../procedures";

const widgetDefinition = (id: string): WidgetDefinition => ({
  id,
  title: id,
  icon: undefined as unknown as WidgetDefinition["icon"],
  size: "medium",
  component: () => null,
});

const createCaller = createCallerFactory(dashboardRouter);

const userIds: string[] = [];
const rootIds: string[] = [];
const scheduledActionIds: string[] = [];
const reviewProductIds: string[] = [];
const customerIds: string[] = [];
const orderIds: string[] = [];
const automationIds: string[] = [];

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

async function createReview(status: boolean, title = "Prodotto") {
  const { root } = await createProductRoot({ title });
  reviewProductIds.push(root.id);

  const review = await db.reviews.create({
    data: {
      rating: 4,
      reviewerName: `Recensore ${randomUUID()}`,
      comment: "Commento",
      productId: root.id,
      status,
      date: new Date(),
    },
  });

  return { review, productId: root.id, title };
}

async function createOrder(status: OrderStatus, totalAmount = 100) {
  const customer = await db.customer.create({
    data: { email: `customer-${randomUUID()}@example.com`, name: "Mario Rossi" },
  });
  customerIds.push(customer.id);

  const order = await db.order.create({
    data: {
      orderNumber: `PW-TEST-${randomUUID().slice(0, 8)}`,
      status,
      customerId: customer.id,
      totalAmount,
      currency: "EUR",
    },
  });
  orderIds.push(order.id);

  return { order, customer };
}

async function createRun(
  status: AutomationRunStatus,
  name = `Flow ${randomUUID()}`,
) {
  const automation = await db.automation.create({ data: { name } });
  automationIds.push(automation.id);

  const run = await db.automationRun.create({
    data: {
      automationId: automation.id,
      triggerType: "manual",
      status,
      graph: {},
      error: status === AutomationRunStatus.FAILED ? "Boom" : null,
    },
  });

  return { run, automation };
}

beforeEach(() => {
  userIds.length = 0;
  rootIds.length = 0;
  scheduledActionIds.length = 0;
  reviewProductIds.length = 0;
  customerIds.length = 0;
  orderIds.length = 0;
  automationIds.length = 0;
});

afterEach(async () => {
  if (scheduledActionIds.length > 0) {
    await db.scheduledAction.deleteMany({
      where: { id: { in: scheduledActionIds } },
    });
  }
  if (reviewProductIds.length > 0) {
    await db.productRoot.deleteMany({
      where: { id: { in: reviewProductIds } },
    });
  }
  if (orderIds.length > 0) {
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
  }
  if (customerIds.length > 0) {
    await db.customer.deleteMany({ where: { id: { in: customerIds } } });
  }
  if (automationIds.length > 0) {
    await db.automation.deleteMany({ where: { id: { in: automationIds } } });
  }
  if (rootIds.length > 0) {
    await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
  }
  if (userIds.length > 0) {
    await db.dashboardLayout.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  userIds.length = 0;
  rootIds.length = 0;
  scheduledActionIds.length = 0;
  reviewProductIds.length = 0;
  customerIds.length = 0;
  orderIds.length = 0;
  automationIds.length = 0;
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

  it("makes the computed layout reflect the saved order and hidden set", async () => {
    const user = await createUser();
    const caller = callerFor(user.id);

    // A reorder, a hidden instance, and a user-added second instance of a
    // definition that also has a default.
    const widgets = [
      { key: "pending-orders", definitionId: "pending-orders" },
      { key: "trend-revenue", definitionId: "trend" },
      { key: "drafts", definitionId: "drafts", hidden: true },
      { key: "trend-contacts", definitionId: "trend" },
    ];

    await caller.saveLayout({ widgets });
    const { widgets: saved } = await caller.getLayout();

    const definitions = [
      widgetDefinition("drafts"),
      widgetDefinition("scheduled"),
      widgetDefinition("pending-orders"),
      widgetDefinition("trend"),
    ];

    const layout = computeDashboardLayout({
      defaults: [
        { key: "drafts", definitionId: "drafts" },
        { key: "scheduled", definitionId: "scheduled" },
        { key: "pending-orders", definitionId: "pending-orders" },
        { key: "trend-contacts", definitionId: "trend" },
      ],
      saved,
      definitions,
      canRead: () => true,
    });

    // Saved order wins, a new default (scheduled) is appended, and the hidden
    // instance is retained but not rendered.
    expect(layout.map((instance) => instance.key)).toEqual([
      "pending-orders",
      "trend-revenue",
      "drafts",
      "trend-contacts",
      "scheduled",
    ]);
    expect(visibleDashboardWidgets(layout).map((instance) => instance.key)).toEqual(
      ["pending-orders", "trend-revenue", "trend-contacts", "scheduled"],
    );
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

describe("dashboard.getScheduled", () => {
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

    const result = await callerFor("any-user").getScheduled();

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

describe("dashboard.getPendingReviews", () => {
  it("counts and lists unpublished reviews only", async () => {
    const pending = await createReview(false, "Prodotto A");
    await createReview(true, "Prodotto B");

    const result = await callerFor("any-user").getPendingReviews();

    expect(result.count).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(pending.review.id);
    expect(result.items[0]?.productTitle).toBe("Prodotto A");
  });
});

describe("dashboard.getPendingOrders", () => {
  it("counts and lists pending orders only, with the customer name", async () => {
    const pending = await createOrder(OrderStatus.PENDING, 250);
    await createOrder(OrderStatus.DRAFT, 10);
    await createOrder(OrderStatus.COMPLETED, 10);

    const result = await callerFor("any-user").getPendingOrders();

    expect(result.count).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(pending.order.id);
    expect(result.items[0]?.totalAmount).toBe(250);
    expect(result.items[0]?.customerName).toBe("Mario Rossi");
  });
});

describe("dashboard.getFailedRuns", () => {
  it("counts and lists failed runs only, with the automation name", async () => {
    const failed = await createRun(AutomationRunStatus.FAILED, "Flusso rotto");
    await createRun(AutomationRunStatus.COMPLETED);
    await createRun(AutomationRunStatus.RUNNING);

    const result = await callerFor("any-user").getFailedRuns();

    expect(result.count).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(failed.run.id);
    expect(result.items[0]?.automationId).toBe(failed.automation.id);
    expect(result.items[0]?.automationName).toBe("Flusso rotto");
    expect(result.items[0]?.error).toBe("Boom");
  });
});
