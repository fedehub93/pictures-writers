import { describe, expect, it } from "vitest";

import { resetMailboxInteraction } from "../views/mailbox-interaction";

describe("mailbox interaction", () => {
  it("switching views clears selection, composer and reply state", () => {
    expect(resetMailboxInteraction()).toEqual({
      selection: {},
      isComposing: false,
      replyingTo: undefined,
    });
  });
});
