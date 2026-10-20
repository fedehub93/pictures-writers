"use client";

import { useMemo, useState } from "react";
import { InboxIcon } from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";
import { cn } from "@/shared/lib/utils";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";

import { useSuspenseAllowedEmailAccounts } from "@/modules/mails/accounts";

import {
  useDeleteConversationForever,
  useMarkConversationRead,
  useMarkConversationUnread,
  useRestoreConversation,
  useSetConversationStarred,
} from "../../hooks/use-conversation-actions";
import { useConversation, useConversations } from "../../hooks/use-conversations";
import { useMailboxCounts } from "../../hooks/use-mailbox-counts";
import { useMarkReadOnOpen } from "../../hooks/use-mark-read-on-open";
import { useSentMessages } from "../../hooks/use-sent-messages";
import { AccountSelector } from "../components/account-selector";
import { ConversationActions } from "../components/conversation-actions";
import { ConversationDetail } from "../components/conversation-detail";
import { ConversationListPanel } from "../components/conversation-list-panel";
import { ConversationReadMenu } from "../components/conversation-read-menu";
import { ReplyComposer } from "../components/composer/reply-composer";
import { NewMessagePanel } from "../components/composer/new-message-panel";
import { MailboxNav, type MailboxView } from "../components/mailbox-nav";
import { SentMessagesPanel } from "../components/sent-messages-panel";
import {
  resetMailboxInteraction,
  type MailboxSelection,
} from "./mailbox-interaction";

export const ConversationsView = () => {
  const { data: accounts } = useSuspenseAllowedEmailAccounts();

  const defaultAccountId = useMemo(
    () => (accounts.find((account) => account.isDefault) ?? accounts[0])?.id,
    [accounts],
  );

  const [preferredAccountId, setPreferredAccountId] = useState<
    string | undefined
  >();

  // The preferred account while it is still allowed, otherwise the default.
  const selectedAccountId = useMemo(() => {
    if (
      preferredAccountId &&
      accounts.some((account) => account.id === preferredAccountId)
    ) {
      return preferredAccountId;
    }
    return defaultAccountId;
  }, [preferredAccountId, accounts, defaultAccountId]);

  const [view, setView] = useState<MailboxView>("inbox");
  const [isComposing, setIsComposing] = useState(false);

  // The open thread is tracked with its account, so switching accounts clears
  // it without a synchronising effect.
  const [selection, setSelection] = useState<MailboxSelection>({});
  const [replyingTo, setReplyingTo] = useState<string>();

  const selectedConversationId =
    selection.accountId === selectedAccountId
      ? selection.conversationId
      : undefined;

  const inboxQuery = useConversations(selectedAccountId, "inbox");
  const starredQuery = useConversations(selectedAccountId, "starred");
  const archivedQuery = useConversations(selectedAccountId, "archived");
  const trashQuery = useConversations(selectedAccountId, "trash");
  const conversationQueries = {
    inbox: inboxQuery,
    starred: starredQuery,
    archived: archivedQuery,
    trash: trashQuery,
  };
  const sentQuery = useSentMessages(selectedAccountId, view === "sent");
  const sentMessages = sentQuery.data ?? [];

  // Counts come from SQL rather than from the loaded lists, so they include
  // conversations beyond the first page and refresh with the polling hook.
  const { data: counts } = useMailboxCounts();
  const selectedCounts = counts?.accounts.find(
    (account) => account.emailAccountId === selectedAccountId,
  );
  const inboxUnreadCount = selectedCounts?.unread ?? 0;
  const archivedCount = selectedCounts?.archived ?? 0;

  const { data: conversation, isLoading: isLoadingConversation } =
    useConversation(selectedConversationId);

  const markRead = useMarkConversationRead();
  const markUnread = useMarkConversationUnread();
  const setStarred = useSetConversationStarred();
  const restore = useRestoreConversation();
  const deleteForever = useDeleteConversationForever();

  // Opening a visible conversation, and new inbound mail while it is open,
  // marks it read. A manual "mark unread" is left alone until the next inbound
  // message.
  useMarkReadOnOpen(conversation);

  const handleMarkRead = (id: string) => {
    markRead.mutate({ id }, { onError: (error) => toast.error(error.message) });
  };

  const handleMarkUnread = (id: string) => {
    markUnread.mutate(
      { id },
      { onError: (error) => toast.error(error.message) },
    );
  };

  const handleToggleStar = (id: string, starred: boolean) => {
    setStarred.mutate(
      { id, starred },
      { onError: (error) => toast.error(error.message) },
    );
  };

  const handleRestore = (id: string) => {
    restore.mutate(
      { id },
      {
        onSuccess: () => toast.success("Conversation restored"),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleDeleteForever = (id: string) => {
    deleteForever.mutate(
      { id },
      {
        onSuccess: () => toast.success("Conversation permanently deleted"),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId,
  );

  if (accounts.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 py-3">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No email accounts</EmptyTitle>
            <EmptyDescription>
              You are not assigned to any email account yet. Ask an
              administrator to grant you access.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const isDetailOpen = isComposing || Boolean(selectedConversationId);

  const openConversation = (accountId: string, conversationId: string) => {
    setPreferredAccountId(accountId);
    setView("inbox");
    setSelection({ accountId, conversationId });
    setIsComposing(false);
    setReplyingTo(undefined);
  };

  const closeConversation = () => {
    setSelection((current) => ({ ...current, conversationId: undefined }));
    setReplyingTo(undefined);
  };

  const resetInteraction = () => {
    const next = resetMailboxInteraction();
    setSelection(next.selection);
    setIsComposing(next.isComposing);
    setReplyingTo(next.replyingTo);
  };

  const handleAccountChange = (accountId: string) => {
    setPreferredAccountId(accountId);
    resetInteraction();
  };

  const handleViewChange = (next: MailboxView) => {
    setView(next);
    resetInteraction();
  };

  const selectConversation = (conversationId: string) => {
    setIsComposing(false);
    setReplyingTo(undefined);
    setSelection({
      accountId: selectedAccountId,
      conversationId,
    });
  };

  const startCompose = () => {
    setIsComposing(true);
    setReplyingTo(undefined);
  };

  const handleDeleted = () => {
    closeConversation();
    setIsComposing(false);
  };

  const accountSelector = (
    <AccountSelector
      accounts={accounts}
      value={selectedAccountId}
      onChange={handleAccountChange}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-1 gap-4 overflow-hidden p-4">
      <MailboxNav
        accounts={accounts}
        accountId={selectedAccountId}
        onAccountChange={handleAccountChange}
        view={view}
        onViewChange={handleViewChange}
        inboxUnreadCount={inboxUnreadCount}
        archivedCount={archivedCount}
        onCompose={startCompose}
      />

      <div
        className={cn(
          "min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm",
          isDetailOpen
            ? "hidden md:flex md:w-88 md:shrink-0"
            : "flex w-full",
        )}
      >
        {view === "sent" ? (
          <SentMessagesPanel
            key={`${selectedAccountId}-sent`}
            messages={sentMessages}
            isLoading={sentQuery.isLoading}
            onOpen={selectConversation}
            lastUpdatedAt={sentQuery.dataUpdatedAt}
            isRefreshing={sentQuery.isFetching && !sentQuery.isLoading}
            onRefresh={() => void sentQuery.refetch()}
            onCompose={startCompose}
            accountSelector={accountSelector}
          />
        ) : (
          <ConversationListPanel
            key={`${selectedAccountId}-${view}`}
            conversations={conversationQueries[view].data ?? []}
            isLoading={conversationQueries[view].isLoading}
            selectedId={selectedConversationId}
            onMarkRead={handleMarkRead}
            onMarkUnread={handleMarkUnread}
            onToggleStar={handleToggleStar}
            onRestore={view === "trash" ? handleRestore : undefined}
            onDeleteForever={
              view === "trash" ? handleDeleteForever : undefined
            }
            onSelect={view === "trash" ? undefined : selectConversation}
            showActions={view !== "trash"}
            lastUpdatedAt={conversationQueries[view].dataUpdatedAt}
            isRefreshing={
              conversationQueries[view].isFetching &&
              !conversationQueries[view].isLoading
            }
            onRefresh={() => void conversationQueries[view].refetch()}
            onCompose={startCompose}
            accountSelector={accountSelector}
          />
        )}
      </div>

      <section
        className={cn("flex min-h-0 flex-1", !isDetailOpen && "hidden")}
      >
        {isComposing ? (
          <NewMessagePanel
            accounts={accounts}
            defaultAccountId={selectedAccountId}
            onDiscard={() => setIsComposing(false)}
            onSent={openConversation}
          />
        ) : (
          <ConversationDetail
            conversation={conversation}
            isLoading={isLoadingConversation}
            onBack={closeConversation}
            onReply={
              conversation
                ? () => setReplyingTo(conversation.id)
                : undefined
            }
            actionsSlot={
              conversation ? (
                <div className="flex items-center gap-0.5">
                  <ConversationReadMenu
                    isUnread={conversation.isUnread}
                    isStarred={conversation.isStarred}
                    onMarkRead={() => handleMarkRead(conversation.id)}
                    onMarkUnread={() => handleMarkUnread(conversation.id)}
                    onToggleStar={() =>
                      handleToggleStar(conversation.id, !conversation.isStarred)
                    }
                  />
                  <ConversationActions
                    conversation={conversation}
                    onReply={() => setReplyingTo(conversation.id)}
                    onArchived={closeConversation}
                    onDeleted={handleDeleted}
                  />
                </div>
              ) : undefined
            }
            replySlot={
              conversation && replyingTo === conversation.id ? (
                <ReplyComposer
                  key={conversation.id}
                  conversation={conversation}
                  account={selectedAccount}
                  onSent={() => setReplyingTo(undefined)}
                  onDiscard={() => setReplyingTo(undefined)}
                />
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  );
};

export const ConversationsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Inbox"
      description="This may take a few seconds"
    />
  );
};

export const ConversationsViewError = () => {
  return <ErrorState title="Error Inbox" description="Something went wrong" />;
};
