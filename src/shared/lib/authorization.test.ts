import { describe, expect, it } from "vitest";

import { can } from "@/shared/lib/authorization";
import { getProcedurePermissions } from "@/shared/lib/permissions";

describe("authorization policy", () => {
  it("grants a permission present on the role", () => {
    expect(can(["posts.read", "posts.update"], "posts.update")).toBe(true);
  });

  it("denies a permission absent from the role", () => {
    expect(can(["posts.read"], "users.manage")).toBe(false);
  });

  it("maps read procedures to the parent area's read permission", () => {
    expect(getProcedurePermissions("posts.getMany")).toEqual(["posts.read"]);
  });

  it("allows manage-only modules to use their manage permission", () => {
    expect(getProcedurePermissions("forms.updateContent")).toEqual([
      "forms.update",
      "forms.manage",
    ]);
  });

  it("uses publish access for post scheduling but manage access for mail scheduling", () => {
    expect(getProcedurePermissions("posts.schedule")).toEqual(["posts.publish"]);
    expect(getProcedurePermissions("singleSends.schedule")).toEqual([
      "single-sends.manage",
    ]);
  });
});
