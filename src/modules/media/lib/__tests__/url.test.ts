import { describe, expect, it } from "vitest";

import { UPLOADTHING_FILE_ORIGIN } from "../image-ladder.mjs";
import { getUploadThingOrigin, storageKeyFromMediaUrl } from "../url";

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

  it("returns the legacy rewrite origin for relative /assets URLs", () => {
    expect(getUploadThingOrigin("/assets/abc123")).toBe(
      UPLOADTHING_FILE_ORIGIN,
    );
  });

  it("ignores other relative and non-UploadThing URLs", () => {
    expect(getUploadThingOrigin("/media/cover.jpg")).toBeNull();
    expect(getUploadThingOrigin("https://example.com/cover.jpg")).toBeNull();
  });
});

describe("storageKeyFromMediaUrl", () => {
  it("extracts the key from a canonical /media/<key> URL", () => {
    expect(storageKeyFromMediaUrl("/media/default/abc/1/original")).toBe(
      "default/abc/1/original",
    );
  });

  it("extracts the key from a legacy /assets/<key> URL", () => {
    expect(storageKeyFromMediaUrl("/assets/legacy-key")).toBe("legacy-key");
  });

  it("extracts the key from an absolute UploadThing URL", () => {
    expect(
      storageKeyFromMediaUrl("https://ghhc7ejbae.ufs.sh/f/uploadthing-key"),
    ).toBe("uploadthing-key");
  });

  it("returns null for unrelated URLs", () => {
    expect(storageKeyFromMediaUrl("https://example.com/cover.jpg")).toBeNull();
  });
});
