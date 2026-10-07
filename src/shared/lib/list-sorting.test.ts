import { describe, expect, it } from "vitest";

import {
  buildListOrderBy,
  compareDefaultOrder,
  sortByDefaultOrder,
  type DefaultSortableRow,
} from "./list-sorting";

const SORTABLE = ["title", "status", "publishedAt", "scheduledAt"] as const;

const row = (
  overrides: Partial<DefaultSortableRow> & { id: string },
): DefaultSortableRow => ({
  title: "Title",
  status: "PUBLISHED",
  publishedAt: null,
  ...overrides,
});

describe("buildListOrderBy", () => {
  it("returns null when no sort is provided", () => {
    expect(
      buildListOrderBy({ sort: null, direction: null, sortable: SORTABLE }),
    ).toBeNull();
  });

  it("returns null for sorts outside the whitelist", () => {
    expect(
      buildListOrderBy({ sort: "price", direction: "asc", sortable: SORTABLE }),
    ).toBeNull();
  });

  it("sorts nullable publication dates with nulls first", () => {
    expect(
      buildListOrderBy({
        sort: "publishedAt",
        direction: "asc",
        sortable: SORTABLE,
      }),
    ).toEqual([
      { publishedAt: { sort: "asc", nulls: "first" } },
      { id: "asc" },
    ]);
  });

  it("sorts nullable scheduling dates with nulls last", () => {
    expect(
      buildListOrderBy({
        sort: "scheduledAt",
        direction: "desc",
        sortable: SORTABLE,
      }),
    ).toEqual([
      { scheduledAt: { sort: "desc", nulls: "last" } },
      { id: "asc" },
    ]);
  });

  it("adds a stable id tie-breaker for plain fields", () => {
    expect(
      buildListOrderBy({
        sort: "title",
        direction: "desc",
        sortable: SORTABLE,
      }),
    ).toEqual([{ title: "desc" }, { id: "asc" }]);
  });

  it("defaults the direction to desc", () => {
    expect(
      buildListOrderBy({
        sort: "title",
        direction: null,
        sortable: SORTABLE,
      }),
    ).toEqual([{ title: "desc" }, { id: "asc" }]);
  });
});

describe("compareDefaultOrder", () => {
  it("ranks unpublished statuses before published ones", () => {
    const draft = row({ id: "d", status: "DRAFT" });
    const changed = row({ id: "c", status: "CHANGED" });
    const scheduled = row({ id: "s", status: "SCHEDULED" });
    const published = row({ id: "p", status: "PUBLISHED" });

    const sorted = sortByDefaultOrder([
      published,
      scheduled,
      changed,
      draft,
    ]);

    expect(sorted.map((r) => r.id)).toEqual(["d", "c", "s", "p"]);
  });

  it("breaks ties by most recent published date, then title", () => {
    const older = row({
      id: "1",
      status: "PUBLISHED",
      title: "A",
      publishedAt: new Date("2024-01-01T00:00:00.000Z"),
    });
    const newer = row({
      id: "2",
      status: "PUBLISHED",
      title: "B",
      publishedAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    const sameDateA = row({
      id: "3",
      status: "PUBLISHED",
      title: "AAA",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const sameDateB = row({
      id: "4",
      status: "PUBLISHED",
      title: "BBB",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const sorted = sortByDefaultOrder([older, newer, sameDateB, sameDateA]);

    expect(sorted.map((r) => r.id)).toEqual(["3", "4", "2", "1"]);
  });

  it("sorts rows without a published date by title", () => {
    const a = row({ id: "1", status: "DRAFT", title: "Zeta" });
    const b = row({ id: "2", status: "DRAFT", title: "Alfa" });

    expect(sortByDefaultOrder([a, b]).map((r) => r.id)).toEqual(["2", "1"]);
    expect(compareDefaultOrder(a, b)).toBeGreaterThan(0);
  });
});
