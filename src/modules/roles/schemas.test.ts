import { describe, expect, it } from "vitest";

import { createRoleSchema, updateRoleSchema } from "./schemas";

describe("role schemas", () => {
  it("accepts seeded system role and permission identifiers", () => {
    expect(updateRoleSchema.parse({
      id: "system-role-admin",
      name: "Administrator",
      isActive: true,
      permissionIds: ["permission:roles.manage"],
    })).toMatchObject({ id: "system-role-admin", permissionIds: ["permission:roles.manage"] });
  });

  it("accepts catalog permission identifiers when creating a role", () => {
    expect(createRoleSchema.parse({
      name: "Editors",
      permissionIds: ["permission:posts.read"],
    }).permissionIds).toEqual(["permission:posts.read"]);
  });
});
