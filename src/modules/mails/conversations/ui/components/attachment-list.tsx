"use client";

import {
  FileArchiveIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  PaperclipIcon,
} from "lucide-react";

import { formatFileSize } from "../../lib/format";
import { type EmailAttachmentGetOne } from "../../types";

function iconForContentType(contentType: string) {
  if (contentType.startsWith("image/")) return ImageIcon;
  if (contentType === "application/pdf" || contentType.includes("pdf")) {
    return FileTextIcon;
  }
  if (
    contentType.includes("zip") ||
    contentType.includes("compressed") ||
    contentType.includes("tar")
  ) {
    return FileArchiveIcon;
  }
  return FileIcon;
}

interface AttachmentListProps {
  attachments: EmailAttachmentGetOne[];
}

export const AttachmentList = ({ attachments }: AttachmentListProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <PaperclipIcon className="size-3.5" />
        {attachments.length} Attachment{attachments.length === 1 ? "" : "s"}
      </div>

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
              className="group flex max-w-full items-center gap-2.5 rounded-lg border bg-background px-2.5 py-2 text-sm transition-colors hover:bg-accent"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">
                  {attachment.filename}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
