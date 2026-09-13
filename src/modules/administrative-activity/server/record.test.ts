import { describe, expect, it } from "vitest";

import { sanitizeActivityData } from "./record";

describe("sanitizeActivityData", () => {
  it("removes secrets from structured activity snapshots", () => {
    expect(sanitizeActivityData({
      status: "PENDING",
      role: { name: "Editor" },
      tokenHash: "never-store",
      nested: { password: "never-store", status: "ACTIVE" },
      apiKey: "never-store",
    })).toEqual({ status: "PENDING", role: { name: "Editor" }, nested: { status: "ACTIVE" } });
  });
});
