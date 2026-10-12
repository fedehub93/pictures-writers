import { describe, expect, it } from "vitest";

import { PERMISSIONS } from "@/shared/lib/permissions";

import { getWidgetDefinition, WIDGET_DEFINITIONS } from "../registry";

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
  });

  it("declares a default size for every definition", () => {
    for (const definition of WIDGET_DEFINITIONS) {
      expect(["small", "medium", "full"]).toContain(definition.defaultSize);
    }
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
        { id: "contacts", label: "Contacts" },
        { id: "revenue", label: "Revenue / orders" },
      ],
    });

    expect(schema).toEqual({
      fields: [
        {
          type: "select",
          name: "metric",
          label: "Metric",
          options: [
            { value: "contacts", label: "Contacts" },
            { value: "revenue", label: "Revenue / orders" },
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
});
