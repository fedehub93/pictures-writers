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

  it("filters configuration contents by default", () => {
    expect(
      sanitizeActivityData({
        config: { siteId: "123", status: "kept" },
      }),
    ).toEqual({ config: { status: "kept" } });
  });

  it("preserves non-secret provider configuration when the caller opts in", () => {
    expect(
      sanitizeActivityData(
        {
          provider: "sample",
          config: {
            siteId: "123",
            cookiePolicyId: "456",
            lang: "it",
            autoblocking: true,
          },
        },
        { preserveKeys: ["config"] },
      ),
    ).toEqual({
      provider: "sample",
      config: {
        siteId: "123",
        cookiePolicyId: "456",
        lang: "it",
        autoblocking: true,
      },
    });
  });
});
