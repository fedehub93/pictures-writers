import { describe, expect, it } from "vitest";

import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  DEFAULT_DASHBOARD_INSTANCES,
  getWidgetDefinition,
  WIDGET_DEFINITIONS,
} from "../registry";
import { computeDashboardLayout } from "../server/layout";

describe("dashboard widget registry", () => {
  it("declares the operational widgets as the default instances, in order", () => {
    expect(WIDGET_DEFINITIONS.map((definition) => definition.id)).toEqual([
      "drafts",
      "scheduled",
      "pending-reviews",
      "pending-orders",
      "failed-runs",
    ]);

    expect(DEFAULT_DASHBOARD_INSTANCES).toEqual([
      { key: "drafts", definitionId: "drafts" },
      { key: "scheduled", definitionId: "scheduled" },
      { key: "pending-reviews", definitionId: "pending-reviews" },
      { key: "pending-orders", definitionId: "pending-orders" },
      { key: "failed-runs", definitionId: "failed-runs" },
    ]);
  });

  it("gates each operational widget on its area's read permission", () => {
    expect(getWidgetDefinition("drafts")?.permission).toBe(
      PERMISSIONS.POSTS_READ,
    );
    expect(getWidgetDefinition("scheduled")?.permission).toBe(
      PERMISSIONS.POSTS_READ,
    );
    expect(getWidgetDefinition("pending-reviews")?.permission).toBe(
      PERMISSIONS.REVIEWS_READ,
    );
    expect(getWidgetDefinition("pending-orders")?.permission).toBe(
      PERMISSIONS.ORDERS_READ,
    );
    expect(getWidgetDefinition("failed-runs")?.permission).toBe(
      PERMISSIONS.AUTOMATIONS_READ,
    );
  });

  it("never surfaces a widget the user lacks permission for", () => {
    const layout = computeDashboardLayout({
      defaults: DEFAULT_DASHBOARD_INSTANCES,
      saved: [],
      definitions: WIDGET_DEFINITIONS,
      canRead: () => false,
    });

    expect(layout).toEqual([]);
  });

  it("keeps only the widgets whose permissions the user holds", () => {
    const layout = computeDashboardLayout({
      defaults: DEFAULT_DASHBOARD_INSTANCES,
      saved: [],
      definitions: WIDGET_DEFINITIONS,
      canRead: (permission) =>
        permission === PERMISSIONS.POSTS_READ ||
        permission === PERMISSIONS.ORDERS_READ,
    });

    expect(layout.map((instance) => instance.key)).toEqual([
      "drafts",
      "scheduled",
      "pending-orders",
    ]);
  });
});
