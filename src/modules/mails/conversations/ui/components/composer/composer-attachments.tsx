"use client";

import { useRef } from "react";
import { FileIcon, ImagePlusIcon, PaperclipIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/shared/ui/button";

import { formatFileSize } from "../../../lib/format";

export type ComposerAttachment = {
  filename: string;
  contentType: string;
  url: string;
  size?: number;
};

interface ComposerAttachmentsProps {
  value: ComposerAttachment[];
  onChange: (attachments: ComposerAttachment[]) => void;
  disabled?: boolean;
}

export const ComposerAttachments = ({
  value,
  onChange,
  disabled,
}: ComposerAttachmentsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("emailAttachments", {
    onClientUploadComplete: (files) => {
      onChange([
        ...value,
        ...files.map((file) => ({
          filename: file.name,
          contentType: file.type,
          url: file.ufsUrl,
          size: file.size,
        })),
      ]);
    },
    onUploadError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    void startUpload(Array.from(files));
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, current) => current !== index));
  };

  const uploadDisabled = disabled || isUploading;

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((attachment, index) => (
            <li
              key={`${attachment.url}-${index}`}
              className="flex max-w-full items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 flex-col">
                <span className="max-w-48 truncate">
                  {attachment.filename}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                aria-label={`Remove ${attachment.filename}`}
                className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <XIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-1">
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
          className="size-8"
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
          className="size-8"
          disabled={uploadDisabled}
          onClick={() => imageInputRef.current?.click()}
          aria-label="Attach images"
          title="Attach images"
        >
          <ImagePlusIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};
