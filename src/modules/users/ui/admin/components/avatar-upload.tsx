"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2Icon, UploadIcon, UserRoundIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { uploadOwnedFile } from "@/shared/lib/upload-owned-file";
import { Button } from "@/shared/ui/button";

interface AvatarUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * The admin avatar control. The image goes through the application transport,
 * so a fresh Installation with no provider token can still set an avatar; the
 * canonical `/files/<key>` address is what the form submits.
 */
export function AvatarUpload({
  value,
  onChange,
  disabled,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);

    try {
      const uploaded = await uploadOwnedFile("/api/files/avatars", file);
      onChange(uploaded.url);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The image could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="relative flex size-36 items-center justify-center overflow-hidden rounded-full bg-muted">
        {value ? (
          <Image
            fill
            src={value}
            alt="Avatar"
            sizes="144px"
            className="object-cover"
          />
        ) : (
          <UserRoundIcon className="size-10 text-muted-foreground" />
        )}

        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove avatar"
            className="absolute top-1 right-1 rounded-full bg-rose-500 p-1 text-white shadow-2xs"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : (
          <UploadIcon data-icon="inline-start" />
        )}
        {uploading ? "Uploading…" : "Upload image"}
      </Button>
    </div>
  );
}
