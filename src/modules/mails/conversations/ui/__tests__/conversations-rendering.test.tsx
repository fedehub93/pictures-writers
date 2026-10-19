import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ConversationDetail } from "../components/conversation-detail";
import { ConversationList } from "../components/conversation-list";
import {
  type ConversationGetOne,
  type ConversationListItem,
} from "../../types";

const noop = () => {};

const unreadConversation: ConversationListItem = {
  id: "conversation-1",
  contactEmail: "jessica.ball@example.com",
  contactName: "Jessica Ball",
  hasUnread: true,
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
  hasUnread: false,
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

  it("shows an empty state when the account has no conversations", () => {
    const html = renderToStaticMarkup(
      <ConversationList conversations={[]} isLoading={false} onSelect={noop} />,
    );

    expect(html).toContain("No conversations");
  });
});

const thread: ConversationGetOne = {
  id: "conversation-1",
  contactEmail: "jessica.ball@example.com",
  contactName: "Jessica Ball",
  contactId: null,
  emailAccountId: "account-1",
  hasUnread: false,
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
});
