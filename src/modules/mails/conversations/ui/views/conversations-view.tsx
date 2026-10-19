"use client";

import { useMemo, useState } from "react";
import { InboxIcon } from "lucide-react";

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

import { useConversation, useConversations } from "../../hooks/use-conversations";
import { AccountSelector } from "../components/account-selector";
import { ConversationActions } from "../components/conversation-actions";
import { ConversationDetail } from "../components/conversation-detail";
import { ConversationListPanel } from "../components/conversation-list-panel";
import { ReplyComposer } from "../components/composer/reply-composer";
import { NewMessagePanel } from "../components/composer/new-message-panel";
import {
  MailboxNav,
  type ConversationView,
} from "../components/mailbox-nav";

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

  const [view, setView] = useState<ConversationView>("inbox");
  const [isComposing, setIsComposing] = useState(false);

  // The open thread is tracked with its account, so switching accounts clears
  // it without a synchronising effect.
  const [selection, setSelection] = useState<{
    accountId?: string;
    conversationId?: string;
  }>({});
  const [replyingTo, setReplyingTo] = useState<string>();

  const selectedConversationId =
    selection.accountId === selectedAccountId
      ? selection.conversationId
      : undefined;

  const inboxQuery = useConversations(selectedAccountId, false);
  const archivedQuery = useConversations(selectedAccountId, true);
  const activeQuery = view === "inbox" ? inboxQuery : archivedQuery;

  const conversations = activeQuery.data ?? [];
  const inboxUnreadCount = (inboxQuery.data ?? []).filter(
    (conversation) => conversation.hasUnread,
  ).length;
  const archivedCount = archivedQuery.data?.length ?? 0;

  const { data: conversation, isLoading: isLoadingConversation } =
    useConversation(selectedConversationId);

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

  const handleAccountChange = (accountId: string) => {
    setPreferredAccountId(accountId);
    setSelection({});
    setIsComposing(false);
    setReplyingTo(undefined);
  };

  const handleViewChange = (next: ConversationView) => {
    setView(next);
    setSelection({});
    setIsComposing(false);
    setReplyingTo(undefined);
  };

  const startCompose = () => {
    setIsComposing(true);
    setReplyingTo(undefined);
  };

  const handleDeleted = () => {
    closeConversation();
    setIsComposing(false);
  };

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
        <ConversationListPanel
          key={`${selectedAccountId}-${view}`}
          conversations={conversations}
          isLoading={activeQuery.isLoading}
          selectedId={selectedConversationId}
          onSelect={(conversationId) => {
            setIsComposing(false);
            setReplyingTo(undefined);
            setSelection({
              accountId: selectedAccountId,
              conversationId,
            });
          }}
          lastUpdatedAt={activeQuery.dataUpdatedAt}
          isRefreshing={activeQuery.isFetching && !activeQuery.isLoading}
          onRefresh={() => void activeQuery.refetch()}
          onCompose={startCompose}
          accountSelector={
            <AccountSelector
              accounts={accounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
            />
          }
        />
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
                <ConversationActions
                  conversation={conversation}
                  onReply={() => setReplyingTo(conversation.id)}
                  onArchived={closeConversation}
                  onDeleted={handleDeleted}
                />
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
