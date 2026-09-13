import { describe, expect, it } from "vitest";

import { can } from "@/shared/lib/authorization";

describe("authorization policy", () => {
  it("grants a permission present on the role", () => {
    expect(can(["posts.read", "posts.update"], "posts.update")).toBe(true);
  });

  it("denies a permission absent from the role", () => {
    expect(can(["posts.read"], "users.manage")).toBe(false);
  });
});
