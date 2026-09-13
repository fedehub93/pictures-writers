import { describe, expect, it } from "vitest";

import {
  legacyUserCreateSchema,
  legacyUserUpdateSchema,
} from "./schemas";

describe("legacy user API contract", () => {
  it("keeps supported profile fields and strips credential and authorization fields", () => {
    const parsed = legacyUserCreateSchema.parse({
      firstName: "Ada",
      bio: "Writer",
      password: "must-not-be-persisted",
      role: "ADMIN",
      accountStatus: "ACTIVE",
    });

    expect(parsed).toEqual({ firstName: "Ada", bio: "Writer" });
  });

  it("accepts the same explicit fields for legacy updates", () => {
    expect(
      legacyUserUpdateSchema.parse({
        firstName: "Ada",
        imageUrl: "https://example.com/ada.png",
        password: "must-not-be-persisted",
      }),
    ).toEqual({ firstName: "Ada", imageUrl: "https://example.com/ada.png" });
  });

  it("rejects an empty legacy user creation", () => {
    expect(() => legacyUserCreateSchema.parse({ bio: "Only a bio" })).toThrow();
  });
});
