import type { LucideIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import type {
  DashboardWidgetInstance,
  WidgetDefinition,
} from "@/shared/dashboard/types";

import { computeDashboardLayout } from "../layout";

const def = (id: string, permission?: string): WidgetDefinition => ({
  id,
  title: id,
  icon: undefined as unknown as LucideIcon,
  group: "content",
  permission,
  defaultSize: "small",
  component: () => null,
});

const instance = (
  key: string,
  definitionId: string,
  overrides: Partial<DashboardWidgetInstance> & { hidden?: boolean } = {},
): DashboardWidgetInstance => ({ key, definitionId, ...overrides });

const allowAll = () => true;
const allowNone = () => false;

describe("computeDashboardLayout", () => {
  it("keeps a saved widget the user is permitted to read", () => {
    const layout = computeDashboardLayout({
      saved: [instance("drafts", "drafts")],
      definitions: [def("drafts", "posts.read")],
      canRead: allowAll,
    });

    expect(layout).toEqual([{ key: "drafts", definitionId: "drafts" }]);
  });

  it("drops a saved widget the user cannot read", () => {
    const layout = computeDashboardLayout({
      saved: [instance("drafts", "drafts")],
      definitions: [def("drafts", "posts.read")],
      canRead: allowNone,
    });

    expect(layout).toEqual([]);
  });

  it("always keeps a widget whose definition declares no permission", () => {
    const layout = computeDashboardLayout({
      saved: [instance("trend", "trend")],
      definitions: [def("trend")],
      canRead: allowNone,
    });

    expect(layout).toEqual([{ key: "trend", definitionId: "trend" }]);
  });

  it("preserves the saved order", () => {
    const layout = computeDashboardLayout({
      saved: [
        instance("c", "c"),
        instance("a", "a"),
        instance("b", "b"),
      ],
      definitions: [def("a"), def("b"), def("c")],
      canRead: allowAll,
    });

    expect(layout.map((item) => item.key)).toEqual(["c", "a", "b"]);
  });

  it("drops a saved instance whose definition is unknown", () => {
    const layout = computeDashboardLayout({
      saved: [instance("ghost", "ghost")],
      definitions: [def("drafts")],
      canRead: allowAll,
    });

    expect(layout).toEqual([]);
  });

  it("keeps a user-created instance and its config", () => {
    const layout = computeDashboardLayout({
      saved: [
        instance("trend-ebooks", "trend", { config: { metric: "ebooks" } }),
      ],
      definitions: [def("trend")],
      canRead: allowAll,
    });

    expect(layout).toEqual([
      {
        key: "trend-ebooks",
        definitionId: "trend",
        config: { metric: "ebooks" },
      },
    ]);
  });

  it("drops a legacy hidden instance instead of resurrecting it", () => {
    const layout = computeDashboardLayout({
      saved: [instance("trend-contacts", "trend", { hidden: true })],
      definitions: [def("trend")],
      canRead: allowAll,
    });

    expect(layout).toEqual([]);
  });

  it("keeps multiple instances of the same definition in a stable order", () => {
    const layout = computeDashboardLayout({
      saved: [
        instance("trend-revenue", "trend"),
        instance("trend-contacts", "trend"),
      ],
      definitions: [def("trend")],
      canRead: allowAll,
    });

    expect(layout.map((item) => item.key)).toEqual([
      "trend-revenue",
      "trend-contacts",
    ]);
  });
});
