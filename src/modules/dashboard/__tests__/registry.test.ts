import { describe, expect, it } from "vitest";

import {
  DEFAULT_DASHBOARD_INSTANCES,
  getWidgetDefinition,
  WIDGET_DEFINITIONS,
} from "../registry";
import { computeDashboardLayout } from "../server/layout";

describe("dashboard widget registry", () => {
  it("declares the drafts widget as the default instance", () => {
    expect(WIDGET_DEFINITIONS.map((definition) => definition.id)).toContain(
      "drafts",
    );
    expect(DEFAULT_DASHBOARD_INSTANCES).toEqual([
      { key: "drafts", definitionId: "drafts" },
    ]);
    expect(getWidgetDefinition("drafts")?.title).toBe("Bozze da pubblicare");
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

  it("keeps the drafts widget for a user who can read posts", () => {
    const layout = computeDashboardLayout({
      defaults: DEFAULT_DASHBOARD_INSTANCES,
      saved: [],
      definitions: WIDGET_DEFINITIONS,
      canRead: (permission) => permission === "posts.read",
    });

    expect(layout.map((instance) => instance.key)).toEqual(["drafts"]);
  });
});
