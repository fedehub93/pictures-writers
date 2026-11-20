import { describe, expect, it } from "vitest";

import { parseStorageDriver } from "../storage-driver";

describe("parseStorageDriver", () => {
  it("accepts the two drivers the application can write with", () => {
    expect(parseStorageDriver("local")).toBe("local");
    expect(parseStorageDriver("uploadthing")).toBe("uploadthing");
  });

  it("rejects an unknown driver instead of falling through to a default", () => {
    for (const value of [
      undefined,
      null,
      "",
      " ",
      "s3",
      "Local",
      "local ",
      0,
      1,
      true,
      {},
      ["local"],
    ]) {
      expect(parseStorageDriver(value)).toBeNull();
    }
  });
});
