import { describe, expect, it } from "vitest";

import {
  initialExpandedMessageIds,
  isConversationMessageExpanded,
  shouldCollapseEarlierMessages,
  toggleExpandedMessage,
} from "../message-expansion";

const ids = ["message-1", "message-2", "message-3"];

describe("message expansion", () => {
  it("only collapses conversations with more than two messages", () => {
    expect(shouldCollapseEarlierMessages(0)).toBe(false);
    expect(shouldCollapseEarlierMessages(1)).toBe(false);
    expect(shouldCollapseEarlierMessages(2)).toBe(false);
    expect(shouldCollapseEarlierMessages(3)).toBe(true);
  });

  it("starts with every message expanded in a short conversation", () => {
    expect([...initialExpandedMessageIds(ids.slice(0, 2))]).toEqual([
      "message-1",
      "message-2",
    ]);
  });

  it("starts with only the newest message expanded in a long conversation", () => {
    expect([...initialExpandedMessageIds(ids)]).toEqual(["message-3"]);
  });

  it("keeps the newest message expanded even before its header is clicked", () => {
    const expandedIds = initialExpandedMessageIds(ids);

    expect(
      isConversationMessageExpanded({
        messageId: "message-3",
        index: 2,
        messageCount: 3,
        expandedIds,
      }),
    ).toBe(true);
    expect(
      isConversationMessageExpanded({
        messageId: "message-1",
        index: 0,
        messageCount: 3,
        expandedIds,
      }),
    ).toBe(false);
  });

  it("toggles an earlier message without mutating the previous set", () => {
    const initial = initialExpandedMessageIds(ids);
    const expanded = toggleExpandedMessage(initial, "message-1");

    expect(expanded.has("message-1")).toBe(true);
    expect(initial.has("message-1")).toBe(false);

    expect(
      isConversationMessageExpanded({
        messageId: "message-1",
        index: 0,
        messageCount: 3,
        expandedIds: expanded,
      }),
    ).toBe(true);

    const collapsedAgain = toggleExpandedMessage(expanded, "message-1");
    expect(collapsedAgain.has("message-1")).toBe(false);
  });
});
