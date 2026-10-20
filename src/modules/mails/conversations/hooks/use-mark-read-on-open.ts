import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { type ConversationGetOne } from "../types";
import { useMarkConversationRead } from "./use-conversation-actions";

type VisibilityState = Document["visibilityState"];

function currentVisibilityState(): VisibilityState {
  return typeof document === "undefined" ? "hidden" : document.visibilityState;
}

type AutoReadConversation = Pick<
  ConversationGetOne,
  "id" | "isUnread" | "lastInboundAt"
>;

/**
 * A conversation is handled once per inbound watermark. A new inbound message
 * moves the watermark, so it is handled again without re-marking the same
 * message on every refetch.
 */
export function conversationReadHandledKey(
  conversationId: string,
  lastInboundAt?: Date | null,
): string {
  return `${conversationId}:${lastInboundAt?.getTime() ?? "none"}`;
}

/**
 * Decide what the auto-read effect should do for the current conversation.
 * A hidden document is not consumed, so the conversation can still become read
 * once the user actually looks at the open tab.
 */
export function conversationReadAction({
  handledKey,
  currentKey,
  isUnread,
  visibilityState,
}: {
  handledKey?: string;
  currentKey: string;
  isUnread: boolean;
  visibilityState: VisibilityState;
}): "skip" | "record" | "mark" {
  if (handledKey === currentKey) return "skip";
  if (visibilityState !== "visible") return "skip";
  return isUnread ? "mark" : "record";
}

/**
 * Mark the open conversation read when it appears while visible, and again
 * whenever a new inbound message advances it while the conversation is open. A
 * manual "mark unread" is left alone until the next inbound message.
 */
export const useMarkReadOnOpen = (conversation?: AutoReadConversation) => {
  const markRead = useMarkConversationRead();
  const handledRef = useRef<string | undefined>(undefined);
  const [visibilityState, setVisibilityState] = useState<VisibilityState>(
    currentVisibilityState,
  );

  const conversationId = conversation?.id;
  const isUnread = conversation?.isUnread ?? false;
  const lastInboundAt = conversation?.lastInboundAt;
  const mutate = markRead.mutate;

  useEffect(() => {
    const updateVisibility = () =>
      setVisibilityState(currentVisibilityState());

    document.addEventListener("visibilitychange", updateVisibility);
    updateVisibility();

    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    const currentKey = conversationReadHandledKey(
      conversationId,
      lastInboundAt,
    );
    const action = conversationReadAction({
      handledKey: handledRef.current,
      currentKey,
      isUnread,
      visibilityState,
    });

    if (action === "skip") return;

    handledRef.current = currentKey;
    if (action === "record") return;

    mutate(
      { id: conversationId },
      { onError: (error) => toast.error(error.message) },
    );
  }, [conversationId, isUnread, lastInboundAt, visibilityState, mutate]);
};
