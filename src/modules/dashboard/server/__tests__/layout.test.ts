import type { LucideIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import type {
  DashboardWidgetInstance,
  WidgetDefinition,
} from "../../types";
import { computeDashboardLayout, visibleDashboardWidgets } from "../layout";

const def = (id: string, permission?: string): WidgetDefinition => ({
  id,
  title: id,
  icon: undefined as unknown as LucideIcon,
  permission,
  size: "small",
  component: () => null,
});

const instance = (
  key: string,
  definitionId: string,
  overrides: Partial<DashboardWidgetInstance> = {},
): DashboardWidgetInstance => ({ key, definitionId, ...overrides });

const allowAll = () => true;
const allowNone = () => false;

describe("computeDashboardLayout", () => {
  it("keeps a default widget the user is permitted to read", () => {
    const layout = computeDashboardLayout({
      defaults: [instance("drafts", "drafts")],
      saved: [],
      definitions: [def("drafts", "posts.read")],
      canRead: allowAll,
    });

    expect(layout).toEqual([{ key: "drafts", definitionId: "drafts" }]);
  });

  it("drops a default widget the user cannot read", () => {
    const layout = computeDashboardLayout({
      defaults: [instance("drafts", "drafts")],
      saved: [],
      definitions: [def("drafts", "posts.read")],
      canRead: allowNone,
    });

    expect(layout).toEqual([]);
  });

  it("always keeps a widget whose definition declares no permission", () => {
    const layout = computeDashboardLayout({
      defaults: [instance("trend", "trend")],
      saved: [],
      definitions: [def("trend")],
      canRead: allowNone,
    });

    expect(layout).toEqual([{ key: "trend", definitionId: "trend" }]);
  });

  it("applies the saved order over the default order", () => {
    const layout = computeDashboardLayout({
      defaults: [
        instance("a", "a"),
        instance("b", "b"),
        instance("c", "c"),
      ],
      saved: [instance("c", "c"), instance("a", "a")],
      definitions: [def("a"), def("b"), def("c")],
      canRead: allowAll,
    });

    expect(layout.map((item) => item.key)).toEqual(["c", "a", "b"]);
  });

  it("appends a default that is absent from the saved document", () => {
    const layout = computeDashboardLayout({
      defaults: [instance("a", "a"), instance("b", "b")],
      saved: [instance("b", "b")],
      definitions: [def("a"), def("b")],
      canRead: allowAll,
    });

    expect(layout.map((item) => item.key)).toEqual(["b", "a"]);
  });

  it("keeps a user-created instance whose definition is permitted", () => {
    const layout = computeDashboardLayout({
      defaults: [instance("trend-contacts", "trend")],
      saved: [
        instance("trend-ebooks", "trend", { config: { metric: "ebooks" } }),
      ],
      definitions: [def("trend")],
      canRead: allowAll,
    });

    expect(layout).toEqual([
      { key: "trend-ebooks", definitionId: "trend", config: { metric: "ebooks" } },
      { key: "trend-contacts", definitionId: "trend" },
    ]);
  });

  it("lets the saved document override hidden and config on a default", () => {
    const layout = computeDashboardLayout({
      defaults: [instance("trend-contacts", "trend")],
      saved: [
        instance("trend-contacts", "trend", {
          hidden: true,
          config: { metric: "revenue" },
        }),
      ],
      definitions: [def("trend")],
      canRead: allowAll,
    });

    expect(layout).toEqual([
      {
        key: "trend-contacts",
        definitionId: "trend",
        hidden: true,
        config: { metric: "revenue" },
      },
    ]);
  });

  it("drops a saved instance whose definition is unknown", () => {
    const layout = computeDashboardLayout({
      defaults: [],
      saved: [instance("ghost", "ghost")],
      definitions: [def("drafts")],
      canRead: allowAll,
    });

    expect(layout).toEqual([]);
  });

  it("drops a saved instance whose definition is no longer permitted", () => {
    const layout = computeDashboardLayout({
      defaults: [],
      saved: [instance("orders", "orders")],
      definitions: [def("orders", "orders.read")],
      canRead: allowNone,
    });

    expect(layout).toEqual([]);
  });

  it("keeps multiple instances of the same definition in a stable order", () => {
    const layout = computeDashboardLayout({
      defaults: [
        instance("trend-contacts", "trend"),
        instance("trend-revenue", "trend"),
      ],
      saved: [instance("trend-revenue", "trend")],
      definitions: [def("trend")],
      canRead: allowAll,
    });

    expect(layout.map((item) => item.key)).toEqual([
      "trend-revenue",
      "trend-contacts",
    ]);
  });
});

describe("visibleDashboardWidgets", () => {
  it("retains hidden instances but excludes them from rendering", () => {
    const layout = [
      instance("a", "a"),
      instance("b", "b", { hidden: true }),
      instance("c", "c"),
    ];

    expect(visibleDashboardWidgets(layout).map((item) => item.key)).toEqual([
      "a",
      "c",
    ]);
  });
});
