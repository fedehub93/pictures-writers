import { describe, expect, it } from "vitest";

import {
  conversationReadAction,
  conversationReadHandledKey,
} from "../../hooks/use-mark-read-on-open";
import { readActionLabel } from "../components/conversation-read-menu";

const key = conversationReadHandledKey(
  "conversation-1",
  new Date("2026-10-17T10:00:00.000Z"),
);

describe("auto-read on open", () => {
  it("marks an unread conversation when the document is visible", () => {
    expect(
      conversationReadAction({
        currentKey: key,
        isUnread: true,
        visibilityState: "visible",
      }),
    ).toBe("mark");
  });

  it("does not consume a hidden conversation, so it can be read later", () => {
    expect(
      conversationReadAction({
        currentKey: key,
        isUnread: true,
        visibilityState: "hidden",
      }),
    ).toBe("skip");

    expect(
      conversationReadAction({
        handledKey: undefined,
        currentKey: key,
        isUnread: true,
        visibilityState: "visible",
      }),
    ).toBe("mark");
  });

  it("records an already read conversation without marking it", () => {
    expect(
      conversationReadAction({
        currentKey: key,
        isUnread: false,
        visibilityState: "visible",
      }),
    ).toBe("record");
  });

  it("handles a new inbound message once per watermark", () => {
    const next = conversationReadHandledKey(
      "conversation-1",
      new Date("2026-10-17T11:00:00.000Z"),
    );

    expect(
      conversationReadAction({
        handledKey: key,
        currentKey: key,
        isUnread: true,
        visibilityState: "visible",
      }),
    ).toBe("skip");

    expect(
      conversationReadAction({
        handledKey: key,
        currentKey: next,
        isUnread: true,
        visibilityState: "visible",
      }),
    ).toBe("mark");
  });
});

describe("read action label", () => {
  it("offers the opposite read action", () => {
    expect(readActionLabel(true)).toBe("Mark as read");
    expect(readActionLabel(false)).toBe("Mark as unread");
  });
});
