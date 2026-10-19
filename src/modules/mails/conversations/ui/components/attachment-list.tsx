"use client";

import { FileIcon, FileTextIcon, ImageIcon } from "lucide-react";

import { formatFileSize } from "../../lib/format";
import { type EmailAttachmentGetOne } from "../../types";

function iconForContentType(contentType: string) {
  if (contentType.startsWith("image/")) return ImageIcon;
  if (contentType === "application/pdf" || contentType.includes("pdf")) {
    return FileTextIcon;
  }
  return FileIcon;
}

interface AttachmentListProps {
  attachments: EmailAttachmentGetOne[];
}

export const AttachmentList = ({ attachments }: AttachmentListProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment) => {
        const Icon = iconForContentType(attachment.contentType);

        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.filename}
            className="flex max-w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{attachment.filename}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
};
