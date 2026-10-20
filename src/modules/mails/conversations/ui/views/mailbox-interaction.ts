export interface MailboxSelection {
  accountId?: string;
  conversationId?: string;
}

export interface MailboxInteractionState {
  selection: MailboxSelection;
  isComposing: boolean;
  replyingTo?: string;
}

/**
 * Switching mailbox view or account must not leave an open thread, composer or
 * reply behind.
 */
export function resetMailboxInteraction(): MailboxInteractionState {
  return { selection: {}, isComposing: false, replyingTo: undefined };
}
