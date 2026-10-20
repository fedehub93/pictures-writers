import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ConversationDetail } from "../components/conversation-detail";
import { ConversationList } from "../components/conversation-list";
import { MailboxNav } from "../components/mailbox-nav";
import {
  type ConversationGetOne,
  type ConversationListItem,
} from "../../types";

const noop = () => {};

const unreadConversation: ConversationListItem = {
  id: "conversation-1",
  contactEmail: "jessica.ball@example.com",
  contactName: "Jessica Ball",
  isUnread: true,
  isStarred: true,
  updatedAt: new Date("2026-10-17T11:58:00.000Z"),
  messageCount: 2,
  lastMessage: {
    subject: "Query about recently purchased soccer socks",
    snippet: "Greetings. I have purchased some socks",
    direction: "INBOUND",
    sentAt: new Date("2026-10-17T11:58:00.000Z"),
    hasAttachments: true,
    attachments: [
      {
        id: "attachment-preview-1",
        filename: "Financial_Reports.pdf",
        contentType: "application/pdf",
      },
    ],
  },
};

const readConversation: ConversationListItem = {
  id: "conversation-2",
  contactEmail: "danny.reid@example.com",
  contactName: null,
  isUnread: false,
  isStarred: false,
  updatedAt: new Date("2026-10-17T09:00:00.000Z"),
  messageCount: 1,
  lastMessage: {
    subject: "How to take the headache out of Order",
    snippet: "Hello! As I have mentioned before",
    direction: "INBOUND",
    sentAt: new Date("2026-10-17T09:00:00.000Z"),
    hasAttachments: false,
    attachments: [],
  },
};

describe("inbox rendering", () => {
  it("renders sender, subject, preview and attachments for each conversation", () => {
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={[unreadConversation, readConversation]}
        isLoading={false}
        selectedId="conversation-1"
        onSelect={noop}
      />,
    );

    expect(html).toContain("Jessica Ball");
    expect(html).toContain("Query about recently purchased soccer socks");
    expect(html).toContain("Greetings. I have purchased some socks");
    expect(html).toContain("Financial_Reports.pdf");
    expect(html).toContain("danny.reid@example.com");
  });

  it("marks unread conversations", () => {
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={[unreadConversation, readConversation]}
        isLoading={false}
        onSelect={noop}
      />,
    );

    expect(html).toContain('aria-label="Unread"');
  });

  it("renders a kebab menu on each conversation row", () => {
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={[unreadConversation]}
        isLoading={false}
        onSelect={noop}
        onMarkRead={noop}
        onMarkUnread={noop}
      />,
    );

    expect(html).toContain('aria-label="Conversation actions"');
  });

  it("shows an empty state when the account has no conversations", () => {
    const html = renderToStaticMarkup(
      <ConversationList conversations={[]} isLoading={false} onSelect={noop} />,
    );

    expect(html).toContain("No conversations");
  });

  it("marks a starred conversation with the canonical term", () => {
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={[unreadConversation, readConversation]}
        isLoading={false}
        onSelect={noop}
      />,
    );

    expect(html).toContain('aria-label="Starred"');
    expect(html).not.toContain("Important");
    expect(html).not.toContain("Flagged");
  });
});

describe("mailbox navigation", () => {
  it("offers Starred alongside the inbox and archive views", () => {
    const html = renderToStaticMarkup(
      <MailboxNav
        accounts={[]}
        view="inbox"
        onViewChange={noop}
        onAccountChange={noop}
        inboxUnreadCount={0}
        archivedCount={0}
        onCompose={noop}
      />,
    );

    expect(html).toContain("Inbox");
    expect(html).toContain("Starred");
    expect(html).toContain("Archived");
    expect(html).not.toContain("Important");
    expect(html).not.toContain("Flagged");
  });
});

const thread: ConversationGetOne = {
  id: "conversation-1",
  contactEmail: "jessica.ball@example.com",
  contactName: "Jessica Ball",
  contactId: null,
  emailAccountId: "account-1",
  isUnread: true,
  isStarred: true,
  lastMessageAt: new Date("2026-10-17T11:58:00.000Z"),
  lastInboundAt: new Date("2026-10-17T11:58:00.000Z"),
  archivedAt: null,
  deletedAt: null,
  createdAt: new Date("2026-10-17T11:00:00.000Z"),
  updatedAt: new Date("2026-10-17T11:58:00.000Z"),
  messages: [
    {
      id: "message-1",
      conversationId: "conversation-1",
      direction: "INBOUND",
      status: "RECEIVED",
      subject: "Query about recently purchased soccer socks",
      bodyHtml: "<p>Greetings. I have purchased some socks</p>",
      bodyText: "Greetings. I have purchased some socks",
      fromAddress: "Jessica Ball <jessica.ball@example.com>",
      toAddresses: ["support@mail.pictureswriters.com"],
      ccAddresses: [],
      bccAddresses: [],
      messageId: null,
      inReplyTo: null,
      references: [],
      externalId: "external-1",
      sentAt: new Date("2026-10-17T11:58:00.000Z"),
      createdAt: new Date("2026-10-17T11:58:00.000Z"),
      updatedAt: new Date("2026-10-17T11:58:00.000Z"),
      attachments: [
        {
          id: "attachment-1",
          emailMessageId: "message-1",
          filename: "workflow-data.pdf",
          contentType: "application/pdf",
          size: 54608,
          url: "https://files.example/workflow-data.pdf",
          externalId: "external-attachment-1",
          createdAt: new Date("2026-10-17T11:58:00.000Z"),
          updatedAt: new Date("2026-10-17T11:58:00.000Z"),
        },
      ],
    },
  ],
};

const baseMessage = thread.messages[0]!;

function messageWithBody(id: string, body: string, at: string) {
  return {
    ...baseMessage,
    id,
    bodyText: body,
    bodyHtml: `<p>${body}</p>`,
    sentAt: new Date(at),
    createdAt: new Date(at),
    attachments: [],
  };
}

const twoMessageConversation: ConversationGetOne = {
  ...thread,
  messages: [
    messageWithBody("message-1", "First body", "2026-10-17T11:00:00.000Z"),
    messageWithBody("message-2", "Second body", "2026-10-17T11:58:00.000Z"),
  ],
};

const longConversation: ConversationGetOne = {
  ...thread,
  messages: [
    messageWithBody("message-1", "Oldest body", "2026-10-17T10:00:00.000Z"),
    messageWithBody("message-2", "Middle body", "2026-10-17T11:00:00.000Z"),
    messageWithBody("message-3", "Newest body", "2026-10-17T11:58:00.000Z"),
  ],
};

describe("conversation detail rendering", () => {
  it("renders the thread with sender, subject, body and attachments", () => {
    const html = renderToStaticMarkup(
      <ConversationDetail
        conversation={thread}
        isLoading={false}
        onBack={noop}
      />,
    );

    expect(html).toContain("Query about recently purchased soccer socks");
    expect(html).toContain("Jessica Ball");
    expect(html).toContain("&lt;jessica.ball@example.com&gt;");
    expect(html).toContain("Greetings. I have purchased some socks");
    expect(html).toContain("workflow-data.pdf");
    expect(html).toContain('href="https://files.example/workflow-data.pdf"');
    expect(html).toContain('download="workflow-data.pdf"');
    expect(html).toContain("Received");
  });

  it("prompts to pick a conversation when none is selected", () => {
    const html = renderToStaticMarkup(
      <ConversationDetail conversation={undefined} isLoading={false} onBack={noop} />,
    );

    expect(html).toContain("No conversation selected");
  });

  it("collapses every message but the newest in a conversation longer than two", () => {
    const html = renderToStaticMarkup(
      <ConversationDetail
        conversation={longConversation}
        isLoading={false}
        onBack={noop}
      />,
    );

    expect(html).not.toContain("Oldest body");
    expect(html).not.toContain("Middle body");
    expect(html).toContain("Newest body");
    expect(html).toContain("Click the header to show this message.");
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2);
  });

  it("keeps a two-message conversation fully expanded", () => {
    const html = renderToStaticMarkup(
      <ConversationDetail
        conversation={twoMessageConversation}
        isLoading={false}
        onBack={noop}
      />,
    );

    expect(html).toContain("First body");
    expect(html).toContain("Second body");
    expect(html).not.toContain('aria-expanded="false"');
  });
});
