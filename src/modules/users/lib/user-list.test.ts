import { describe, expect, it } from "vitest";

import { getUserOrderBy } from "./user-list";

describe("user list ordering", () => {
  it.each([
    ["name", "asc"],
    ["email", "desc"],
    ["createdAt", "desc"],
    ["accountStatus", "asc"],
  ] as const)("adds a stable id tie-breaker to %s %s", (sort, direction) => {
    expect(getUserOrderBy(sort, direction)).toEqual([
      { [sort]: direction },
      { id: "asc" },
    ]);
  });

});
