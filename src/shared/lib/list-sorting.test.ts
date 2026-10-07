import { describe, expect, it } from "vitest";

import {
  buildListOrderBy,
  DEFAULT_PUBLISHED_ORDER_BY,
} from "./list-sorting";

const SORTABLE = ["title", "status", "publishedAt"] as const;

describe("buildListOrderBy", () => {
  it("falls back to the default order when no sort is provided", () => {
    expect(
      buildListOrderBy({ sort: null, direction: null, sortable: SORTABLE }),
    ).toEqual(DEFAULT_PUBLISHED_ORDER_BY);
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

  it("adds a stable id tie-breaker for plain fields", () => {
    expect(
      buildListOrderBy({
        sort: "title",
        direction: "desc",
        sortable: SORTABLE,
      }),
    ).toEqual([{ title: "desc" }, { id: "asc" }]);
  });

  it("ignores sorts outside the whitelist", () => {
    expect(
      buildListOrderBy({
        sort: "price",
        direction: "asc",
        sortable: SORTABLE,
      }),
    ).toEqual(DEFAULT_PUBLISHED_ORDER_BY);
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
