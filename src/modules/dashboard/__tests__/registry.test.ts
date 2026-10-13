import { describe, expect, it } from "vitest";

import { PERMISSIONS } from "@/shared/lib/permissions";
import { WIDGET_GROUP_IDS } from "@/shared/dashboard/types";

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

  it("assigns every definition to a Widget group", () => {
    for (const definition of WIDGET_DEFINITIONS) {
      expect(WIDGET_GROUP_IDS).toContain(definition.group);
    }

    expect(getWidgetDefinition("drafts")?.group).toBe("content");
    expect(getWidgetDefinition("scheduled")?.group).toBe("content");
    expect(getWidgetDefinition("pending-reviews")?.group).toBe("shop");
    expect(getWidgetDefinition("pending-orders")?.group).toBe("shop");
    expect(getWidgetDefinition("failed-runs")?.group).toBe("automations");
    expect(getWidgetDefinition("trend")?.group).toBe("analytics");
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
      forms: [],
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

  it("adds the forms picker only for the form-submissions metric", () => {
    const definition = getWidgetDefinition("trend");
    const context = {
      metrics: [
        { id: "submissions", label: "Form submissions" },
        { id: "revenue", label: "Revenue / orders" },
      ],
      forms: [
        { id: "form-feedback", label: "Feedback" },
        { id: "form-contact", label: "Contatti" },
      ],
    };
    const metricField = {
      type: "select",
      name: "metric",
      label: "Metric",
      options: [
        { value: "submissions", label: "Form submissions" },
        { value: "revenue", label: "Revenue / orders" },
      ],
    };
    const formsField = {
      type: "multiselect",
      name: "forms",
      label: "Forms",
      allByDefault: true,
      options: [
        { value: "form-feedback", label: "Feedback" },
        { value: "form-contact", label: "Contatti" },
      ],
    };

    expect(
      definition?.configSchema?.(context, { metric: "submissions" })?.fields,
    ).toEqual([metricField, formsField]);

    // Another metric keeps the picker to the metric alone.
    expect(
      definition?.configSchema?.(context, { metric: "revenue" })?.fields,
    ).toEqual([metricField]);

    // With no config the Trend renders the first permitted metric, so the
    // picker matches it.
    expect(definition?.configSchema?.(context)?.fields).toEqual([
      metricField,
      formsField,
    ]);

    // A user who may read no form is not offered the picker.
    expect(
      definition?.configSchema?.(
        { ...context, forms: [] },
        { metric: "submissions" },
      )?.fields,
    ).toEqual([metricField]);
  });

  it("leaves the operational widgets without a config schema", () => {
    for (const id of ["pending-reviews", "pending-orders", "failed-runs"]) {
      expect(getWidgetDefinition(id)?.configSchema).toBeUndefined();
    }
  });

  it("offers the drafts widget a status filter defaulting to drafts and changed", () => {
    const definition = getWidgetDefinition("drafts");

    const schema = definition?.configSchema?.({ metrics: [], forms: [] });

    expect(schema?.fields).toEqual([
      {
        type: "multiselect",
        name: "statuses",
        label: "Statuses",
        options: [
          { value: "DRAFT", label: "Draft" },
          { value: "CHANGED", label: "Changed" },
          { value: "SCHEDULED", label: "Scheduled" },
          { value: "PUBLISHED", label: "Published" },
        ],
      },
    ]);
    expect(definition?.defaultConfig).toEqual({
      statuses: ["DRAFT", "CHANGED"],
    });
  });

  it("offers the scheduled widget a type filter defaulting to every type", () => {
    const definition = getWidgetDefinition("scheduled");

    const schema = definition?.configSchema?.({ metrics: [], forms: [] });

    expect(schema?.fields).toEqual([
      {
        type: "multiselect",
        name: "types",
        label: "Types",
        options: [
          { value: "PUBLISH_POST", label: "Posts" },
          { value: "SEND_EMAIL", label: "Newsletters" },
        ],
      },
    ]);
    expect(definition?.defaultConfig).toEqual({
      types: ["PUBLISH_POST", "SEND_EMAIL"],
    });
  });
});

describe("dashboard widget titles", () => {
  const emptyContext = { metrics: [], forms: [] };
  const trendContext = {
    metrics: [
      { id: "contacts", label: "Contacts" },
      { id: "submissions", label: "Form submissions" },
    ],
    forms: [
      { id: "form-feedback", label: "Feedback" },
      { id: "form-contact", label: "Contatti" },
    ],
  };

  it("names an unrenamed Trend after its metric", () => {
    const definition = getWidgetDefinition("trend");

    expect(
      definition?.resolveTitle?.(trendContext, { metric: "submissions" }),
    ).toBe("Form submissions");
    expect(definition?.resolveTitle?.(trendContext)).toBe("Contacts");
    expect(definition?.resolveTitle?.(emptyContext)).toBe("Trend");
  });
});
