import { describe, expect, it } from "vitest";

import { mediaDeletionCleanupNotice } from "../deletion-notice";

describe("mediaDeletionCleanupNotice", () => {
  it("says nothing when every object was removed", () => {
    expect(
      mediaDeletionCleanupNotice([
        { mediaId: "a", status: "removed" },
        { mediaId: "b", status: "removed" },
      ]),
    ).toBeNull();
  });

  it("reports a skipped object in the singular", () => {
    expect(
      mediaDeletionCleanupNotice([{ mediaId: "a", status: "skipped" }]),
    ).toBe(
      "1 stored object was left in place because the provider that owns it is not configured on this installation.",
    );
  });

  it("reports both skipped and failed objects", () => {
    expect(
      mediaDeletionCleanupNotice([
        { mediaId: "a", status: "skipped" },
        { mediaId: "b", status: "skipped" },
        { mediaId: "c", status: "failed" },
        { mediaId: "d", status: "removed" },
      ]),
    ).toBe(
      "2 stored objects were left in place because the provider that owns them is not configured on this installation, and 1 stored object was not removed from storage.",
    );
  });
});
