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

interface MessageItemProps {
  message: EmailMessageGetOne;
}

export const MessageItem = ({ message }: MessageItemProps) => {
  const isOutbound = message.direction === "OUTBOUND";
  const body = messageBody(message);
  const sender = parseAddress(message.fromAddress);
  const senderName = sender.name ?? sender.email;
  const sentAt = message.sentAt ?? message.createdAt;

  return (
    <article className="border-b px-4 py-5 last:border-b-0 md:px-6">
      <header className="flex items-start gap-3">
        <ContactAvatar name={senderName} className="size-10" />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="truncate text-sm font-semibold">
              {senderName}
            </span>
            {sender.name && (
              <span className="truncate text-xs text-muted-foreground">
                &lt;{sender.email}&gt;
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="truncate">
              to {message.toAddresses.join(", ")}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={new Date(sentAt).toISOString()}>
              {formatMessageDate(sentAt)}
            </time>
          </div>
        </div>

        <Badge variant="secondary" className="shrink-0">
          {isOutbound ? "Sent" : "Received"}
        </Badge>
      </header>

      <div className="mt-4 text-sm leading-relaxed break-words whitespace-pre-wrap">
        {body || "This message has no content."}
      </div>

      {message.attachments.length > 0 && (
        <div className="mt-4">
          <AttachmentList attachments={message.attachments} />
        </div>
      )}
    </article>
  );
};
