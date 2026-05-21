"use client";

import { FileIcon, X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { MediaType } from "@/generated/prisma";

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
  onChange: (files: FileUploadOnChange[]) => void;
  value?: FileUploadOnChange[];
  endpoint: keyof typeof ourFileRouter;
  setIsFocused?: Dispatch<SetStateAction<boolean>>;
  size?: "small" | "medium" | "large";
  disabled: boolean;
}

export const FileUploadButton = ({
  onChange,
  value = [],
  endpoint,
  setIsFocused,
  size = "large",
  disabled,
}: FileUploadProps) => {
  const handleRemove = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  return (
    <div className="flex flex-col gap-2">
      {value.map((file, idx) => (
        <div
          key={file.key + idx}
          className={cn(
            "relative p-2 border rounded-md flex items-center justify-between",
            disabled && "bg-muted"
          )}
        >
          <Link
            href={file.url as Route}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline flex items-center gap-x-2 flex-1"
          >
            <FileIcon
              className="size-6 text-primary rounded-lg p-1"
              strokeWidth={1}
            />
            {file.name} - {formatBytes(file.size)}
          </Link>
          {!disabled && (
            <Button
              onClick={() => handleRemove(idx)}
              className="bg-destructive text-primary-foreground p-1 rounded-full shadow-2xs size-6 ml-2"
              type="button"
              size="icon"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      ))}

      <div className="py-4 border border-dashed rounded-md">
        <UploadButton
          className="custom-upload-button mt-0!"
          endpoint={endpoint}
          onBeforeUploadBegin={(files) => {
            setIsFocused && setIsFocused(true);
            return files;
          }}
          onClientUploadComplete={(res) => {
            const newFiles = res.map((r) => ({
              key: r.key,
              name: r.name,
              url: r.ufsUrl,
              size: r.size,
              type: r.type,
            }));
            onChange([...value, ...newFiles]);
            setIsFocused && setIsFocused(false);
          }}
          onUploadError={(error: Error) => {
            console.log(error);
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
