"use client";

import { useMemo, useState } from "react";
import { InboxIcon } from "lucide-react";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

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
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { useSuspenseAllowedEmailAccounts } from "@/modules/mails/accounts";

import { useConversation, useConversations } from "../../hooks/use-conversations";
import { AccountSelector } from "../components/account-selector";
import { ConversationActions } from "../components/conversation-actions";
import { ConversationDetail } from "../components/conversation-detail";
import { ConversationList } from "../components/conversation-list";
import { ReplyComposer } from "../components/composer/reply-composer";
import { NewMessageDialog } from "../components/new-message-dialog";

type ConversationView = "inbox" | "archived";

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

  // The open thread is tracked with its account, so switching accounts clears
  // it without a synchronising effect.
  const [selection, setSelection] = useState<{
    accountId?: string;
    conversationId?: string;
  }>({});

  const selectedConversationId =
    selection.accountId === selectedAccountId
      ? selection.conversationId
      : undefined;

  const { data: conversations, isLoading: isLoadingConversations } =
    useConversations(selectedAccountId, view === "archived");
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

  const openConversation = (accountId: string, conversationId: string) => {
    setView("inbox");
    setPreferredAccountId(accountId);
    setSelection({ accountId, conversationId });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="px-6 pt-3">
        <ContentHeader label="Inbox" totalEntries={conversations?.length ?? 0} />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "flex min-h-0 w-full flex-col border-r md:w-96",
            selectedConversationId && "hidden md:flex",
          )}
        >
          <div className="flex flex-col gap-3 border-b p-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <AccountSelector
                  accounts={accounts}
                  value={selectedAccountId}
                  onChange={setPreferredAccountId}
                />
              </div>
              <NewMessageDialog
                accounts={accounts}
                defaultAccountId={selectedAccountId}
                onSent={openConversation}
              />
            </div>

            <Tabs
              value={view}
              onValueChange={(value) => {
                setView(value as ConversationView);
                setSelection((current) => ({
                  ...current,
                  conversationId: undefined,
                }));
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="inbox">Inbox</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ConversationList
            conversations={conversations ?? []}
            isLoading={isLoadingConversations}
            selectedId={selectedConversationId}
            onSelect={(id) =>
              setSelection({ accountId: selectedAccountId, conversationId: id })
            }
          />
        </aside>

        <section
          className={cn(
            "min-h-0 flex-1",
            selectedConversationId ? "flex" : "hidden md:flex",
          )}
        >
          <ConversationDetail
            conversation={conversation}
            isLoading={isLoadingConversation}
            onBack={() =>
              setSelection((current) => ({
                ...current,
                conversationId: undefined,
              }))
            }
            actionsSlot={
              conversation ? (
                <ConversationActions
                  conversation={conversation}
                  onDeleted={() =>
                    setSelection((current) => ({
                      ...current,
                      conversationId: undefined,
                    }))
                  }
                />
              ) : undefined
            }
            replySlot={
              conversation ? (
                <ReplyComposer
                  key={conversation.id}
                  conversation={conversation}
                  account={selectedAccount}
                />
              ) : undefined
            }
          />
        </section>
      </div>
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
