import { describe, expect, it } from "vitest";

import type { WidgetDefinition } from "@/shared/dashboard/types";

import { permittedLibraryDefinitions } from "../widget-library";

const definition = (
  id: string,
  overrides: Partial<WidgetDefinition> = {},
): WidgetDefinition =>
  ({
    id,
    title: id,
    icon: undefined as unknown as WidgetDefinition["icon"],
    group: "content",
    defaultSize: "small",
    component: () => null,
    ...overrides,
  }) as WidgetDefinition;

const ids = (definitions: WidgetDefinition[]) =>
  definitions.map((entry) => entry.id);

const allowAll = () => true;
const allowNone = () => false;

describe("permittedLibraryDefinitions", () => {
  it("keeps a definition the user is permitted to read", () => {
    const result = permittedLibraryDefinitions(
      [definition("drafts", { permission: "posts.read" })],
      allowAll,
      0,
    );

    expect(ids(result)).toEqual(["drafts"]);
  });

  it("drops a definition the user cannot read", () => {
    const result = permittedLibraryDefinitions(
      [definition("drafts", { permission: "posts.read" })],
      allowNone,
      0,
    );

    expect(result).toEqual([]);
  });

  it("always keeps a definition that declares no permission", () => {
    const result = permittedLibraryDefinitions(
      [definition("trend", { category: "analytics" })],
      allowNone,
      2,
    );

    expect(ids(result)).toEqual(["trend"]);
  });

  it("offers the analytics widget only when the user can read a Metric", () => {
    const definitions = [definition("trend", { category: "analytics" })];

    expect(permittedLibraryDefinitions(definitions, allowAll, 0)).toEqual([]);
    expect(ids(permittedLibraryDefinitions(definitions, allowAll, 1))).toEqual([
      "trend",
    ]);
  });

  it("drops an unpermitted analytics widget even when Metrics exist", () => {
    const result = permittedLibraryDefinitions(
      [definition("trend", { category: "analytics", permission: "posts.read" })],
      allowNone,
      3,
    );

    expect(result).toEqual([]);
  });

  it("preserves the catalog order", () => {
    const result = permittedLibraryDefinitions(
      [
        definition("a", { permission: "a.read" }),
        definition("trend", { category: "analytics" }),
        definition("b", { permission: "b.read" }),
      ],
      allowAll,
      1,
    );

    expect(ids(result)).toEqual(["a", "trend", "b"]);
  });
});
