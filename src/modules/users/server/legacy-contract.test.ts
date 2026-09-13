import { describe, expect, it } from "vitest";

import { legacyUserSelect } from "./legacy-contract";

describe("legacy user response contract", () => {
  it("does not select passwords, sessions, accounts, or token-bearing relations", () => {
    expect(legacyUserSelect).not.toHaveProperty("password");
    expect(legacyUserSelect).not.toHaveProperty("sessions");
    expect(legacyUserSelect).not.toHaveProperty("accounts");
    expect(legacyUserSelect).not.toHaveProperty("roleDefinition");
    expect(legacyUserSelect).not.toHaveProperty("emailVerified");
    expect(legacyUserSelect).not.toHaveProperty("roleId");
  });
});
