/**
 * Long conversations open with only the newest message expanded, so the latest reply
 * is immediately readable. Shorter conversations stay fully expanded.
 */
export function shouldCollapseEarlierMessages(messageCount: number): boolean {
  return messageCount > 2;
}

/** Message ids that start expanded for a conversation. */
export function initialExpandedMessageIds(
  messageIds: readonly string[],
): Set<string> {
  if (!shouldCollapseEarlierMessages(messageIds.length)) {
    return new Set(messageIds);
  }

  return new Set(messageIds.slice(-1));
}

/**
 * The newest message is always visible once a conversation is long enough to
 * collapse. Earlier messages are visible only after their header was clicked.
 */
export function isConversationMessageExpanded({
  messageId,
  index,
  messageCount,
  expandedIds,
}: {
  messageId: string;
  index: number;
  messageCount: number;
  expandedIds: ReadonlySet<string>;
}): boolean {
  if (!shouldCollapseEarlierMessages(messageCount)) return true;
  if (index === messageCount - 1) return true;
  return expandedIds.has(messageId);
}

/** Toggle one message header without mutating the previous set. */
export function toggleExpandedMessage(
  expandedIds: ReadonlySet<string>,
  messageId: string,
): Set<string> {
  const next = new Set(expandedIds);

  if (next.has(messageId)) {
    next.delete(messageId);
  } else {
    next.add(messageId);
  }

  return next;
}
