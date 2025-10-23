"use client";

import { FileIcon, X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { MediaType } from "@prisma/client";

import { UploadButton } from "@/lib/uploadthing";
import { ourFileRouter } from "@/app/api/uploadthing/core";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import { Route } from "next";

export type FileUploadOnChange = {
  key: string;
  name: string;
  url: string;
  size: number;
  type: string;
};

interface FileUploadProps {
  onChange: ({ key, name, url, size, type }: FileUploadOnChange) => void;
  value?: {
    key: string;
    name: string;
    url: string;
    size: number;
    type: string;
  };
  endpoint: keyof typeof ourFileRouter;
  setIsFocused?: Dispatch<SetStateAction<boolean>>;
  size?: "small" | "medium" | "large";
  disabled: boolean;
}

export const FileUploadButton = ({
  onChange,
  value,
  endpoint,
  setIsFocused,
  size = "large",
  disabled,
}: FileUploadProps) => {
  if (
    value &&
    value.key &&
    value.type &&
    value.type !== "application/pdf" &&
    value.type !== MediaType.FILE
  ) {
    return (
      <div
        className={cn(
          "relative rounded-md overflow-hidden",
          size === "small" && "w-40 h-auto aspect-square",
          size === "large" && "w-96 h-72 aspect-video"
        )}
      >
        {/* <Image fill src={value} alt="Upload" className="object-cover" /> */}
        {!disabled && (
          <Button
            onClick={() =>
              onChange({ key: "", name: "", url: "", size: 0, type: "" })
            }
            className="bg-destructive text-primary-foreground p-1 rounded-full absolute -top-8 right-0 shadow-2xs size-6"
            type="button"
            size="icon"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  if (
    value &&
    value.key &&
    value.type &&
    (value.type === "application/pdf" || value.type === MediaType.FILE)
  ) {
    return (
      <div
        className={cn("relative p-2 border rounded-md", disabled && `bg-muted`)}
      >
        <Link
          href={value.url as Route}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm hover:underline flex items-center gap-x-2"
        >
          <FileIcon
            className="size-10 text-primary rounded-lg p-1"
            strokeWidth={1}
          />
          {value.name} - {formatBytes(value.size)}
        </Link>
        {!disabled && (
          <Button
            onClick={() =>
              onChange({ key: "", name: "", url: "", size: 0, type: "" })
            }
            className="bg-destructive text-primary-foreground p-1 rounded-full absolute -top-8 right-2 shadow-2xs size-6"
            type="button"
            disabled={disabled}
            size="icon"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="py-4 border border-dashed rounded-md">
      <UploadButton
        className="custom-upload-button mt-0!"
        endpoint={endpoint}
        onBeforeUploadBegin={(files) => {
          setIsFocused && setIsFocused(true);
          return files;
        }}
        onClientUploadComplete={(res) => {
          onChange({
            key: res?.[0].key,
            name: res?.[0].name,
            url: res?.[0].ufsUrl,
            size: res?.[0].size,
            type: res?.[0].type,
          });
          setIsFocused && setIsFocused(false);
        }}
        onUploadError={(error: Error) => {
          console.log(error);
        }}
        disabled={disabled}
      />
    </div>
  );
};
