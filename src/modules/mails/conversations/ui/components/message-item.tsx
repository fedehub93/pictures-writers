"use client";

import { Badge } from "@/shared/ui/badge";

import {
  formatMessageDate,
  messageBody,
  parseAddress,
} from "../../lib/format";
import { type EmailMessageGetOne } from "../../types";
import { AttachmentList } from "./attachment-list";
import { ContactAvatar } from "./contact-avatar";
import { MessageBody } from "./message-body";

interface MessageItemProps {
  message: EmailMessageGetOne;
  /** Render only the header; clicking it expands the message. */
  collapsed?: boolean;
  onToggle?: () => void;
}

export const MessageItem = ({
  message,
  collapsed = false,
  onToggle,
}: MessageItemProps) => {
  const isOutbound = message.direction === "OUTBOUND";
  const body = messageBody(message);
  const bodyHtml = message.bodyHtml?.trim();
  const sender = parseAddress(message.fromAddress);
  const senderName = sender.name ?? sender.email;
  const sentAt = message.sentAt ?? message.createdAt;
  const isCollapsible = Boolean(onToggle);

  const summary = (
    <>
      <ContactAvatar name={senderName} className="size-10" />

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="truncate text-sm font-semibold">{senderName}</span>
          {sender.name && (
            <span className="truncate text-xs text-muted-foreground">
              &lt;{sender.email}&gt;
            </span>
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="truncate">to {message.toAddresses.join(", ")}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={new Date(sentAt).toISOString()}>
            {formatMessageDate(sentAt)}
          </time>
        </span>
      </span>
    </>
  );

  return (
    <article className="border-b px-4 py-5 last:border-b-0 md:px-6">
      <header className="flex items-start gap-3">
        {isCollapsible ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            className="flex min-w-0 flex-1 items-start gap-3 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {summary}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-start gap-3">{summary}</div>
        )}

        <Badge variant="secondary" className="shrink-0">
          {isOutbound ? "Sent" : "Received"}
        </Badge>
      </header>

      {collapsed ? (
        <p className="mt-2 pl-[3.25rem] text-xs text-muted-foreground">
          Click the header to show this message.
        </p>
      ) : (
        <>
          {bodyHtml ? (
            <div className="mt-4">
              <MessageBody
                html={bodyHtml}
                title={`Message from ${senderName}`}
                messageId={message.id}
              />
            </div>
          ) : (
            <div className="mt-4 text-sm leading-relaxed break-words whitespace-pre-wrap">
              {body || "This message has no content."}
            </div>
          )}

          {message.attachments.length > 0 && (
            <div className="mt-4">
              <AttachmentList attachments={message.attachments} />
            </div>
          )}
        </>
      )}
    </article>
  );
};
