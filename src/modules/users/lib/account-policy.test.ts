import { describe, expect, it } from "vitest";

import { assertAccountChangeAllowed } from "./account-policy";

const admin = (id: string, accountStatus: "ACTIVE" | "SUSPENDED" = "ACTIVE") => ({
  id,
  accountStatus,
  roleDefinition: {
    isActive: true,
    permissions: ["roles.read", "roles.manage", "users.manage"].map((key) => ({
      permission: { key },
    })),
  },
});

describe("account policy", () => {
  it("rejects changing the current user's role or status", () => {
    expect(() =>
      assertAccountChangeAllowed({
        actorId: "user-1",
        target: admin("user-1"),
        changesRole: true,
        changesStatus: false,
        qualifiedAdministratorCount: 2,
        resultingUser: admin("user-1"),
      }),
    ).toThrow("own role");
  });

  it("protects the last administrator from suspension", () => {
    expect(() =>
      assertAccountChangeAllowed({
        actorId: "user-2",
        target: admin("user-1"),
        changesRole: false,
        changesStatus: true,
        qualifiedAdministratorCount: 1,
        resultingUser: admin("user-1", "SUSPENDED"),
      }),
    ).toThrow("last active administrator");
  });

  it("allows removing management permissions when another administrator exists", () => {
    expect(() =>
      assertAccountChangeAllowed({
        actorId: "user-2",
        target: admin("user-1"),
        changesRole: true,
        changesStatus: false,
        qualifiedAdministratorCount: 2,
        resultingUser: { ...admin("user-1"), roleDefinition: { isActive: true, permissions: [] } },
      }),
    ).not.toThrow();
  });
});
