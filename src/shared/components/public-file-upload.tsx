"use client";

import { useRef, useState } from "react";
import { FileIcon, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { toast } from "sonner";

import { formatBytes } from "@/lib/format";
import { cn } from "@/shared/lib/utils";
import {
  PUBLIC_FORM_ATTACHMENT_MAX_FILES,
  uploadPublicFormFile,
  type PublicFormAttachment,
} from "@/shared/lib/public-form-upload";
import { Button } from "@/shared/ui/button";

interface PublicFileUploadProps {
  /**
   * The form the answer belongs to. The upload endpoint is public and
   * rate-limited per form, so this is required for a real upload; the
   * designer preview omits it and renders a disabled control instead.
   */
  formId?: string;
  value?: PublicFormAttachment[];
  onChange: (files: PublicFormAttachment[]) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

/**
 * The visitor-facing upload control. The bytes go through the Installation's
 * own transport, so a form works on an Installation with no provider account
 * and the answer points at `/files/<key>` rather than at a provider.
 */
export const PublicFileUpload = ({
  formId,
  value = [],
  onChange,
  disabled = false,
  size = "large",
}: PublicFileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const atLimit = value.length >= PUBLIC_FORM_ATTACHMENT_MAX_FILES;
  const canUpload = Boolean(formId) && !disabled && !isUploading && !atLimit;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !formId) return;

    setIsUploading(true);

    try {
      const selected = Array.from(files).slice(
        0,
        PUBLIC_FORM_ATTACHMENT_MAX_FILES - value.length,
      );
      const results = await Promise.allSettled(
        selected.map((file) => uploadPublicFormFile(formId, file)),
      );
      const uploaded = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );

      if (uploaded.length > 0) {
        onChange(
          [...value, ...uploaded].slice(0, PUBLIC_FORM_ATTACHMENT_MAX_FILES),
        );
      }

      const failure = results.find((result) => result.status === "rejected");
      if (failure && failure.status === "rejected") {
        toast.error(
          failure.reason instanceof Error
            ? failure.reason.message
            : "The file could not be uploaded.",
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, current) => current !== index));
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {value.map((file, index) => (
        <div
          key={file.storedFileId ?? file.key ?? `${file.url}-${index}`}
          className={cn(
            "relative flex items-center justify-between rounded-md border p-2",
            disabled && "bg-muted",
          )}
        >
          <Link
            href={file.url as Route}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center gap-x-2 text-sm hover:underline"
          >
            <FileIcon
              className="size-6 rounded-lg p-1 text-primary"
              strokeWidth={1}
            />
            {file.name} - {formatBytes(file.size)}
          </Link>
          {!disabled && (
            <Button
              onClick={() => handleRemove(index)}
              className="ml-2 size-6 rounded-full bg-destructive p-1 text-primary-foreground shadow-2xs"
              type="button"
              size="icon"
              aria-label={`Remove ${file.name}`}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      ))}

      <div
        className={cn(
          "rounded-md border border-dashed py-4",
          size === "small" && "py-3",
        )}
      >
        <Button
          type="button"
          variant="secondary"
          className="mx-auto flex"
          disabled={!canUpload}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Uploading..." : "Carica file"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        {atLimit && !disabled && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Al massimo {PUBLIC_FORM_ATTACHMENT_MAX_FILES} file.
          </p>
        )}
      </div>
    </div>
  );
};
