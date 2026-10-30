import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ConversationDetail } from "../components/conversation-detail";
import { ConversationList } from "../components/conversation-list";
import { deleteForeverTitle } from "../components/conversation-trash-menu";
import { MailboxNav } from "../components/mailbox-nav";
import { SentMessageList } from "../components/sent-message-list";
import {
  type ConversationGetOne,
  type ConversationListItem,
  type SentMessageListItem,
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

describe("trash actions", () => {
  it("renders restore and permanent delete actions on trash rows", () => {
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={[readConversation]}
        isLoading={false}
        showActions={false}
        onRestore={noop}
        onDeleteForever={noop}
      />,
    );

    expect(html).toContain('aria-label="Trash actions"');
    expect(html).not.toContain('aria-label="Conversation actions"');
  });

  it("names the conversation in the permanent delete confirmation", () => {
    expect(deleteForeverTitle("Jessica Ball")).toBe(
      "Permanently delete conversation with Jessica Ball?",
    );
  });
});

describe("mailbox navigation", () => {
  it("groups mailbox and filtered views with their canonical labels", () => {
    const html = renderToStaticMarkup(
      <MailboxNav
        accounts={[]}
        view="inbox"
        onViewChange={noop}
        onAccountChange={noop}
        inboxUnreadCount={4}
        archivedCount={2}
        onCompose={noop}
      />,
    );

    expect(html).toContain("Mailbox");
    expect(html).toContain("Inbox");
    expect(html).toContain("Sent");
    expect(html).toContain("Trash");
    expect(html).toContain("Filtered");
    expect(html).toContain("Starred");
    expect(html).toContain("Archive");
    expect(html).not.toContain("Archived");
    expect(html).not.toContain("Important");
    expect(html).not.toContain("Flagged");
    expect(html).toContain(">4<");
    expect(html).toContain(">2<");
  });
});

const sentMessages: SentMessageListItem[] = [
  {
    id: "message-1",
    conversationId: "conversation-1",
    subject: "Re: Invoice",
    recipients: ["client@example.com"],
    snippet: "Here is the quote you asked for",
    sentAt: new Date("2026-10-17T11:58:00.000Z"),
    attachments: [
      {
        id: "attachment-1",
        filename: "quote.pdf",
        contentType: "application/pdf",
      },
    ],
  },
];

describe("sent message list rendering", () => {
  it("renders outbound messages with recipients, subject, preview and attachments", () => {
    const html = renderToStaticMarkup(
      <SentMessageList
        messages={sentMessages}
        isLoading={false}
        onOpen={noop}
      />,
    );

    expect(html).toContain("client@example.com");
    expect(html).toContain("Re: Invoice");
    expect(html).toContain("Here is the quote you asked for");
    expect(html).toContain("quote.pdf");
    expect(html).toContain('aria-label="Open conversation"');
  });

  it("shows an empty state when nothing was sent", () => {
    const html = renderToStaticMarkup(
      <SentMessageList messages={[]} isLoading={false} onOpen={noop} />,
    );

    expect(html).toContain("No sent messages");
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

const textOnlyConversation: ConversationGetOne = {
  ...thread,
  messages: [
    {
      ...thread.messages[0]!,
      id: "message-text",
      bodyHtml: null,
      bodyText: "Plain body only",
      attachments: [],
    },
  ],
};

const remoteImageConversation: ConversationGetOne = {
  ...thread,
  messages: [
    {
      ...thread.messages[0]!,
      id: "message-remote",
      bodyHtml:
        '<p>Hello</p><img src="https://tracker.test/pixel.gif" alt="tracked">',
      bodyText: "Hello",
      attachments: [],
    },
  ],
};

const outboundConversation: ConversationGetOne = {
  ...thread,
  messages: [
    {
      ...thread.messages[0]!,
      id: "message-outbound",
      direction: "OUTBOUND",
      subject: "Re: Query about recently purchased soccer socks",
      bodyHtml: "<p>Thanks for <strong>your patience</strong></p>",
      bodyText: "Thanks for your patience",
      fromAddress: "Support Team <support@example.com>",
      toAddresses: ["jessica.ball@example.com"],
      attachments: [],
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
  it("renders the thread with sender, subject, sandboxed body and attachments", () => {
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
    expect(html).toContain('sandbox="allow-scripts"');
    expect(html).toContain('title="Message from Jessica Ball"');
    expect(html).toMatch(/srcdoc="/i);
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("default-src");
    expect(html).toContain("style-src");
    expect(html).toContain("script-src");
    expect(html).toContain("&lt;p&gt;Greetings. I have purchased some socks");
    expect(html).toContain("workflow-data.pdf");
    expect(html).toContain('href="https://files.example/workflow-data.pdf"');
    expect(html).toContain('download="workflow-data.pdf"');
    expect(html).toContain("Received");
    expect(html).not.toContain("Show images");
  });

  it("renders an outbound formatted message in the same sandboxed frame", () => {
    const html = renderToStaticMarkup(
      <ConversationDetail
        conversation={outboundConversation}
        isLoading={false}
        onBack={noop}
      />,
    );

    expect(html).toContain("Sent");
    expect(html).toContain('sandbox="allow-scripts"');
    expect(html).toContain('title="Message from Support Team"');
    expect(html).toMatch(/srcdoc="/i);
    expect(html).toContain("Thanks for ");
    expect(html).toContain("&lt;strong&gt;your patience&lt;/strong&gt;");
  });

  it("keeps the plain-text path for a message without HTML", () => {
    const html = renderToStaticMarkup(
      <ConversationDetail
        conversation={textOnlyConversation}
        isLoading={false}
        onBack={noop}
      />,
    );

    expect(html).toContain("Plain body only");
    expect(html).not.toMatch(/srcdoc=/i);
    expect(html).not.toContain('sandbox="allow-scripts"');
    expect(html).not.toContain("Show images");
  });

  it("shows the images control only when the message has remote content", () => {
    const remoteHtml = renderToStaticMarkup(
      <ConversationDetail
        conversation={remoteImageConversation}
        isLoading={false}
        onBack={noop}
      />,
    );

    expect(remoteHtml).toContain("Show images");
    expect(remoteHtml).toContain('aria-pressed="false"');
    expect(remoteHtml).not.toContain("tracker.test");
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
    expect(html.match(/<iframe/g)).toHaveLength(1);
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
    expect(html.match(/<iframe/g)).toHaveLength(2);
  });
});
