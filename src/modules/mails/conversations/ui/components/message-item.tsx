"use client";

import { Badge } from "@/shared/ui/badge";

import { formatMessageDate, messageBody } from "../../lib/format";
import { type EmailMessageGetOne } from "../../types";
import { AttachmentList } from "./attachment-list";
import { ContactAvatar } from "./contact-avatar";

interface MessageItemProps {
  message: EmailMessageGetOne;
}

export const MessageItem = ({ message }: MessageItemProps) => {
  const isOutbound = message.direction === "OUTBOUND";
  const body = messageBody(message);

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      <header className="flex items-start gap-3">
        <ContactAvatar name={message.fromAddress} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium">
              {message.fromAddress}
            </span>
            <Badge variant="secondary">
              {isOutbound ? "Sent" : "Received"}
            </Badge>
          </div>
          {message.subject && (
            <span className="truncate text-sm">{message.subject}</span>
          )}
          <span className="truncate text-xs text-muted-foreground">
            to {message.toAddresses.join(", ")}
          </span>
        </div>

        <time className="shrink-0 text-xs text-muted-foreground">
          {formatMessageDate(message.sentAt ?? message.createdAt)}
        </time>
      </header>

      <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
        {body || "This message has no content."}
      </div>

      <AttachmentList attachments={message.attachments} />
    </article>
  );
};
