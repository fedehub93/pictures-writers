import { describe, expect, it } from "vitest";

import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  DEFAULT_DASHBOARD_INSTANCES,
  getWidgetDefinition,
  WIDGET_DEFINITIONS,
} from "../registry";
import { computeDashboardLayout } from "../server/layout";

describe("dashboard widget registry", () => {
  it("declares the operational widgets plus the Trend, in order", () => {
    expect(WIDGET_DEFINITIONS.map((definition) => definition.id)).toEqual([
      "drafts",
      "scheduled",
      "pending-reviews",
      "pending-orders",
      "failed-runs",
      "trend",
    ]);

    expect(DEFAULT_DASHBOARD_INSTANCES).toEqual([
      { key: "drafts", definitionId: "drafts" },
      { key: "scheduled", definitionId: "scheduled" },
      { key: "pending-reviews", definitionId: "pending-reviews" },
      { key: "pending-orders", definitionId: "pending-orders" },
      { key: "failed-runs", definitionId: "failed-runs" },
      {
        key: "trend-contacts",
        definitionId: "trend",
        config: { metric: "contacts" },
      },
      {
        key: "trend-submissions",
        definitionId: "trend",
        config: { metric: "submissions" },
      },
      {
        key: "trend-ebooks",
        definitionId: "trend",
        config: { metric: "ebooks" },
      },
      {
        key: "trend-revenue",
        definitionId: "trend",
        config: { metric: "revenue" },
      },
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

  it("leaves the Trend ungated by a definition permission and marks it analytics", () => {
    expect(getWidgetDefinition("trend")?.permission).toBeUndefined();
    expect(getWidgetDefinition("trend")?.category).toBe("analytics");
  });

  it("generates the Trend's metric picker from the permitted metrics", () => {
    const schema = getWidgetDefinition("trend")?.configSchema?.({
      metrics: [
        { id: "contacts", label: "Iscritti / contatti" },
        { id: "revenue", label: "Ricavi / ordini" },
      ],
    });

    expect(schema).toEqual({
      fields: [
        {
          type: "select",
          name: "metric",
          label: "Metrica",
          options: [
            { value: "contacts", label: "Iscritti / contatti" },
            { value: "revenue", label: "Ricavi / ordini" },
          ],
        },
      ],
    });
  });

  it("leaves the operational widgets without a config schema", () => {
    for (const id of [
      "drafts",
      "scheduled",
      "pending-reviews",
      "pending-orders",
      "failed-runs",
    ]) {
      expect(getWidgetDefinition(id)?.configSchema).toBeUndefined();
    }
  });

  it("seeds a Trend instance for the contact metric", () => {
    const trend = DEFAULT_DASHBOARD_INSTANCES.find(
      (instance) => instance.definitionId === "trend",
    );

    expect(trend).toEqual({
      key: "trend-contacts",
      definitionId: "trend",
      config: { metric: "contacts" },
    });
  });

  it("keeps only the ungated Trend when the user holds no area permission", () => {
    const layout = computeDashboardLayout({
      defaults: DEFAULT_DASHBOARD_INSTANCES,
      saved: [],
      definitions: WIDGET_DEFINITIONS,
      canRead: () => false,
    });

    // The Trend declares no definition permission; its availability comes from
    // the metrics the user may read, not from the layout merge.
    expect(layout.map((instance) => instance.key)).toEqual([
      "trend-contacts",
      "trend-submissions",
      "trend-ebooks",
      "trend-revenue",
    ]);
  });

  it("keeps the widgets whose permissions the user holds plus the Trend", () => {
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
      "trend-contacts",
      "trend-submissions",
      "trend-ebooks",
      "trend-revenue",
    ]);
  });
});
