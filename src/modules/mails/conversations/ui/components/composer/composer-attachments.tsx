"use client";

import { useRef, useState } from "react";
import { FileIcon, ImagePlusIcon, PaperclipIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { uploadOwnedFile } from "@/shared/lib/upload-owned-file";
import { Button } from "@/shared/ui/button";

import { formatFileSize } from "../../../lib/format";

export type ComposerAttachment = {
  storedFileId: string;
  filename: string;
  contentType: string;
  url: string;
  size?: number;
};

interface ComposerAttachmentButtonsProps {
  onAdd: (attachments: ComposerAttachment[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Upload triggers for the composer. The bytes go through the application
 * transport, so an Installation with no provider account can still attach a
 * file; the returned stored-file id is what the send mutation claims.
 */
export const ComposerAttachmentButtons = ({
  onAdd,
  disabled,
  className,
}: ComposerAttachmentButtonsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) =>
          uploadOwnedFile("/api/files/attachments", file),
        ),
      );

      onAdd(
        uploaded.map((file) => ({
          storedFileId: file.storedFileId,
          filename: file.filename,
          contentType: file.contentType,
          url: file.url,
          size: file.size,
        })),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The file could not be uploaded.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const uploadDisabled = disabled || isUploading;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground"
        disabled={uploadDisabled}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Attach files"
        title="Attach files"
      >
        <PaperclipIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground"
        disabled={uploadDisabled}
        onClick={() => imageInputRef.current?.click()}
        aria-label="Attach images"
        title="Attach images"
      >
        <ImagePlusIcon className="size-4" />
      </Button>
      {isUploading && (
        <span className="text-xs text-muted-foreground">Uploading…</span>
      )}
    </div>
  );
};

interface ComposerAttachmentListProps {
  value: ComposerAttachment[];
  onChange: (attachments: ComposerAttachment[]) => void;
  disabled?: boolean;
  className?: string;
}

/** Pending outbound attachments, rendered as removable chips. */
export const ComposerAttachmentList = ({
  value,
  onChange,
  disabled,
  className,
}: ComposerAttachmentListProps) => {
  if (value.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {value.map((attachment, index) => (
        <li
          key={`${attachment.url}-${index}`}
          className="flex max-w-full items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm"
        >
          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex min-w-0 flex-col">
            <span className="max-w-48 truncate">{attachment.filename}</span>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(attachment.size)}
            </span>
          </span>
          <button
            type="button"
            onClick={() =>
              onChange(value.filter((_, current) => current !== index))
            }
            disabled={disabled}
            aria-label={`Remove ${attachment.filename}`}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <XIcon className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
};
