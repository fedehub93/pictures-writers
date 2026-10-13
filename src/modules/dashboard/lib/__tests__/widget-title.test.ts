import { describe, expect, it } from "vitest";

import type {
  DashboardWidgetInstance,
  WidgetDefinition,
} from "@/shared/dashboard/types";

import { resolveWidgetTitle } from "../widget-title";

const definition = (overrides: Partial<WidgetDefinition> = {}): WidgetDefinition =>
  ({
    id: "trend",
    title: "Trend",
    icon: undefined as unknown as WidgetDefinition["icon"],
    group: "analytics",
    defaultSize: "medium",
    component: () => null,
    ...overrides,
  }) as WidgetDefinition;

const instance = (
  overrides: Partial<DashboardWidgetInstance> = {},
): DashboardWidgetInstance => ({ key: "trend-1", definitionId: "trend", ...overrides });

const context = { metrics: [], forms: [] };

describe("resolveWidgetTitle", () => {
  it("uses the instance override when the user renamed the widget", () => {
    expect(
      resolveWidgetTitle(
        definition({ resolveTitle: () => "Contacts" }),
        instance({ title: "My contacts" }),
        context,
      ),
    ).toBe("My contacts");
  });

  it("falls back to the definition's config-derived title when there is no override", () => {
    expect(
      resolveWidgetTitle(
        definition({ resolveTitle: () => "Contacts" }),
        instance(),
        context,
      ),
    ).toBe("Contacts");
  });

  it("falls back to the static title when the derived title is absent", () => {
    expect(resolveWidgetTitle(definition(), instance(), context)).toBe("Trend");
  });

  it("treats a whitespace-only override as no override", () => {
    expect(
      resolveWidgetTitle(
        definition({ resolveTitle: () => "Contacts" }),
        instance({ title: "   " }),
        context,
      ),
    ).toBe("Contacts");
  });

  it("ignores an empty derived title and uses the static one", () => {
    expect(
      resolveWidgetTitle(
        definition({ resolveTitle: () => "  " }),
        instance(),
        context,
      ),
    ).toBe("Trend");
  });
});
