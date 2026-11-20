import { describe, expect, it } from "vitest";

import { backfillExitCode } from "../backfill-cli";

describe("backfillExitCode", () => {
  it("fails the process when a Media could not be processed", () => {
    expect(
      backfillExitCode({
        failed: [
          {
            mediaId: "media-1",
            name: "cover.jpg",
            reason: "no readable storage key",
          },
        ],
      }),
    ).toBe(1);
  });

  it("succeeds when nothing failed", () => {
    expect(backfillExitCode({ failed: [] })).toBe(0);
  });
});
