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

// The metric procedures enforce each metric's own permission through
// `getAuthorizedUser`. Stub it here with the permission keys the test wants the
// current user to hold, so the metric registry's filtering is what is exercised.
const { permissionKeysByUser } = vi.hoisted(() => ({
  permissionKeysByUser: new Map<string, string[]>(),
}));

vi.mock("@/shared/lib/authorization", () => ({
  getAuthorizedUser: async (userId: string) => {
    const permissionKeys = permissionKeysByUser.get(userId);
    return permissionKeys ? { id: userId, permissionKeys } : null;
  },
}));

import { createCallerFactory } from "@/trpc/init";

import { db } from "@/shared/lib/db";
import { PERMISSIONS, getProcedurePermissions } from "@/shared/lib/permissions";
import type { WidgetDefinition } from "@/shared/dashboard/types";

import { computeDashboardLayout } from "../layout";
import { dashboardRouter } from "../procedures";

const widgetDefinition = (id: string): WidgetDefinition => ({
  id,
  title: id,
  icon: undefined as unknown as WidgetDefinition["icon"],
  group: "content",
  defaultSize: "medium",
  component: () => null,
});

const grid = (x = 0, y = 0, w = 6, h = 4) => ({ x, y, w, h });

const createCaller = createCallerFactory(dashboardRouter);

const userIds: string[] = [];
const formIds: string[] = [];
const submissionIds: string[] = [];

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

beforeEach(() => {
  userIds.length = 0;
  formIds.length = 0;
  submissionIds.length = 0;
  permissionKeysByUser.clear();
});

afterEach(async () => {
  if (submissionIds.length > 0) {
    await db.formSubmission.deleteMany({ where: { id: { in: submissionIds } } });
  }
  if (formIds.length > 0) {
    await db.form.deleteMany({ where: { id: { in: formIds } } });
  }
  if (userIds.length > 0) {
    await db.dashboardLayout.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  userIds.length = 0;
  formIds.length = 0;
  submissionIds.length = 0;
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
      {
        key: "drafts",
        definitionId: "drafts",
        grid: grid(0, 0, 12, 5),
        title: "My drafts",
      },
      {
        key: "trend-contacts",
        definitionId: "trend",
        grid: grid(0, 5, 6, 4),
        config: { metric: "contacts" },
      },
    ];

    await caller.saveLayout({ widgets });
    const layout = await caller.getLayout();

    expect(layout.widgets).toEqual(widgets);
  });

  it("persists each instance's config independently and round-trips a change", async () => {
    const user = await createUser();
    const caller = callerFor(user.id);
    const widgets = [
      {
        key: "trend-contacts",
        definitionId: "trend",
        grid: grid(0, 0, 6, 4),
        config: { metric: "contacts" },
      },
      {
        key: "trend-shifted",
        definitionId: "trend",
        grid: grid(6, 0, 6, 4),
        config: { metric: "revenue" },
      },
    ];

    await caller.saveLayout({ widgets });
    const saved = await caller.getLayout();

    expect(saved.widgets).toEqual(widgets);

    // Re-configuring one instance leaves the other one's config untouched.
    const next = saved.widgets.map((instance) =>
      instance.key === "trend-shifted"
        ? { ...instance, config: { metric: "submissions" } }
        : instance,
    );
    await caller.saveLayout({ widgets: next });
    const reloaded = await caller.getLayout();

    expect(reloaded.widgets).toEqual([
      {
        key: "trend-contacts",
        definitionId: "trend",
        grid: grid(0, 0, 6, 4),
        config: { metric: "contacts" },
      },
      {
        key: "trend-shifted",
        definitionId: "trend",
        grid: grid(6, 0, 6, 4),
        config: { metric: "submissions" },
      },
    ]);
  });

  it("round-trips a Trend's selected forms through saveLayout", async () => {
    const user = await createUser();
    const caller = callerFor(user.id);
    const widgets = [
      {
        key: "trend-submissions",
        definitionId: "trend",
        grid: grid(3, 0, 9, 4),
        config: { metric: "submissions", forms: ["form-a", "form-b"] },
      },
    ];

    await caller.saveLayout({ widgets });
    const saved = await caller.getLayout();

    expect(saved.widgets).toEqual(widgets);
  });

  it("replaces the previous layout on a second save", async () => {
    const user = await createUser();
    const caller = callerFor(user.id);

    await caller.saveLayout({
      widgets: [{ key: "drafts", definitionId: "drafts", grid: grid() }],
    });
    await caller.saveLayout({
      widgets: [
        { key: "drafts", definitionId: "drafts", grid: grid(6, 0, 6, 4) },
      ],
    });

    const layout = await caller.getLayout();

    expect(layout.widgets).toEqual([
      { key: "drafts", definitionId: "drafts", grid: grid(6, 0, 6, 4) },
    ]);
  });

  it("never affects another user's layout", async () => {
    const owner = await createUser();
    const other = await createUser();

    await callerFor(owner.id).saveLayout({
      widgets: [{ key: "drafts", definitionId: "drafts", grid: grid() }],
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

  it("round-trips a positioned arrangement through saveLayout and the filter", async () => {
    const user = await createUser();
    const caller = callerFor(user.id);

    // Two instances of one definition, each with its own placement.
    const widgets = [
      { key: "orders", definitionId: "orders", grid: grid(0, 0, 6, 4) },
      { key: "trend-revenue", definitionId: "trend", grid: grid(6, 0, 3, 3) },
      { key: "drafts", definitionId: "drafts", grid: grid(0, 4, 12, 5) },
      { key: "trend-contacts", definitionId: "trend", grid: grid(9, 0, 3, 3) },
    ];

    await caller.saveLayout({ widgets });
    const { widgets: saved } = await caller.getLayout();

    const definitions = [
      widgetDefinition("drafts"),
      widgetDefinition("orders"),
      widgetDefinition("trend"),
    ];

    const layout = computeDashboardLayout({
      saved,
      definitions,
      canRead: () => true,
    });

    expect(layout.map((instance) => instance.key)).toEqual([
      "orders",
      "trend-revenue",
      "drafts",
      "trend-contacts",
    ]);
    expect(layout.map((instance) => instance.grid)).toEqual([
      grid(0, 0, 6, 4),
      grid(6, 0, 3, 3),
      grid(0, 4, 12, 5),
      grid(9, 0, 3, 3),
    ]);
  });
});

describe("dashboard.getMetrics", () => {
  it("returns only the metrics the user is permitted to read", async () => {
    permissionKeysByUser.set("with-contacts", [PERMISSIONS.CONTACTS_READ]);
    permissionKeysByUser.set("without-contacts", []);

    const permitted = await callerFor("with-contacts").getMetrics();
    const forbidden = await callerFor("without-contacts").getMetrics();

    expect(permitted).toEqual([{ id: "contacts", label: "Contacts" }]);
    expect(forbidden).toEqual([]);
  });

  it("exposes each new metric only under its own area permission", async () => {
    permissionKeysByUser.set("full", [
      PERMISSIONS.CONTACTS_READ,
      PERMISSIONS.SUBMISSIONS_READ,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.ORDERS_READ,
    ]);
    permissionKeysByUser.set("dashboard-only", [PERMISSIONS.DASHBOARD_READ]);

    const full = await callerFor("full").getMetrics();
    const dashboardOnly = await callerFor("dashboard-only").getMetrics();

    expect(full.map((metric) => metric.id)).toEqual([
      "contacts",
      "submissions",
      "ebooks",
      "revenue",
    ]);
    expect(dashboardOnly).toEqual([{ id: "ebooks", label: "Ebook downloads" }]);
  });

  it("gates reading metrics behind dashboard.read", () => {
    expect(getProcedurePermissions("dashboard.getMetrics")).toEqual([
      PERMISSIONS.DASHBOARD_READ,
    ]);
    expect(getProcedurePermissions("dashboard.getMetricSeries")).toEqual([
      PERMISSIONS.DASHBOARD_READ,
    ]);
  });
});

describe("dashboard.getFormOptions", () => {
  it("lists the dynamic forms and drops the non-rendered shadow forms", async () => {
    const form = await db.form.create({
      data: { name: `Feedback ${randomUUID()}` },
    });
    formIds.push(form.id);

    permissionKeysByUser.set("with-submissions", [PERMISSIONS.SUBMISSIONS_READ]);
    const options = await callerFor("with-submissions").getFormOptions();

    expect(options).toContainEqual({ id: form.id, label: form.name });
    expect(options.map((option) => option.id)).not.toContain(
      "built-in-form-newsletter",
    );
    expect(options.map((option) => option.id)).not.toContain(
      "built-in-form-ebook",
    );
  });

  it("lists a lead-magnet form so its downloads can be filtered per product", async () => {
    const form = await db.form.create({
      data: {
        name: `Workbook ${randomUUID()}`,
        interactionType: "workbook_downloaded",
      },
    });
    formIds.push(form.id);

    permissionKeysByUser.set("with-submissions", [PERMISSIONS.SUBMISSIONS_READ]);
    const options = await callerFor("with-submissions").getFormOptions();

    expect(options).toContainEqual({ id: form.id, label: form.name });
  });

  it("returns no forms to a user who may not read submissions", async () => {
    permissionKeysByUser.set("no-submissions", []);

    expect(await callerFor("no-submissions").getFormOptions()).toEqual([]);
  });

  it("gates the form picker behind dashboard.read", () => {
    expect(getProcedurePermissions("dashboard.getFormOptions")).toEqual([
      PERMISSIONS.DASHBOARD_READ,
    ]);
  });
});

describe("dashboard.getMetricSeries", () => {
  const from = new Date(2026, 0, 1).toISOString();
  const to = new Date(2026, 0, 31, 23, 59, 59).toISOString();

  it("returns the series for a metric the user may read", async () => {
    permissionKeysByUser.set("contacts", [PERMISSIONS.CONTACTS_READ]);

    const series = await callerFor("contacts").getMetricSeries({
      metricId: "contacts",
      from,
      to,
    });

    expect(series.points).toHaveLength(1);
    expect(series).toHaveProperty("total");
    expect(series).toHaveProperty("percentageGrowth");
  });

  it("refuses a metric the user may not read", async () => {
    permissionKeysByUser.set("no-contacts", []);

    await expect(
      callerFor("no-contacts").getMetricSeries({
        metricId: "contacts",
        from,
        to,
      }),
    ).rejects.toThrow();
  });

  it("refuses an unknown metric id", async () => {
    permissionKeysByUser.set("contacts", [PERMISSIONS.CONTACTS_READ]);

    await expect(
      callerFor("contacts").getMetricSeries({
        metricId: "ghost",
        from,
        to,
      }),
    ).rejects.toThrow();
  });

  it("scopes a form-submissions series to all or one lead-magnet form", async () => {
    permissionKeysByUser.set("submissions", [PERMISSIONS.SUBMISSIONS_READ]);
    const workbookForm = await db.form.create({
      data: {
        name: `Workbook ${randomUUID()}`,
        interactionType: "workbook_downloaded",
      },
    });
    const templateForm = await db.form.create({
      data: {
        name: `Template ${randomUUID()}`,
        interactionType: "template_downloaded",
      },
    });
    formIds.push(workbookForm.id, templateForm.id);

    for (const formId of [workbookForm.id, templateForm.id]) {
      const submission = await db.formSubmission.create({
        data: {
          formId,
          data: {},
          createdAt: new Date("2026-01-15T12:00:00.000Z"),
        },
      });
      submissionIds.push(submission.id);
    }

    const caller = callerFor("submissions");
    const allDownloads = await caller.getMetricSeries({
      metricId: "submissions",
      from,
      to,
      formIds: [workbookForm.id, templateForm.id],
    });
    const workbookDownloads = await caller.getMetricSeries({
      metricId: "submissions",
      from,
      to,
      formIds: [workbookForm.id],
    });

    expect(allDownloads.total).toBe(2);
    expect(workbookDownloads.total).toBe(1);
  });
});
