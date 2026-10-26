import { describe, expect, it } from "vitest";

import { getUploadThingOrigin } from "../url";

describe("getUploadThingOrigin", () => {
  it("returns the origin of a ufs.sh image", () => {
    expect(
      getUploadThingOrigin("https://ghhc7ejbae.ufs.sh/f/abc123"),
    ).toBe("https://ghhc7ejbae.ufs.sh");
  });

  it("returns the origin of a utfs.io image", () => {
    expect(getUploadThingOrigin("https://utfs.io/f/abc123")).toBe(
      "https://utfs.io",
    );
  });

  it("ignores relative and non-UploadThing URLs", () => {
    expect(getUploadThingOrigin("/assets/abc123")).toBeNull();
    expect(getUploadThingOrigin("https://example.com/cover.jpg")).toBeNull();
  });
});
