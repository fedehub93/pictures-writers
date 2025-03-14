"use client";

import { FileIcon, X } from "lucide-react";
import Image from "next/image";

import { UploadDropzone } from "@/lib/uploadthing";
import { ourFileRouter } from "@/app/api/uploadthing/core";

import "@uploadthing/react/styles.css";
import { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { processImage } from "@/lib/image";

export type FileUploadOnChange = {
  key: string;
  name: string;
  url: string;
  size: number;
};

interface FileUploadProps {
  onChange: ({ key, name, url, size }: FileUploadOnChange) => void;
  value?: string;
  endpoint: keyof typeof ourFileRouter;
  setIsFocused?: Dispatch<SetStateAction<boolean>>;
  size?: "small" | "medium" | "large";
}

export const FileUpload = ({
  onChange,
  value,
  endpoint,
  setIsFocused,
  size = "large",
}: FileUploadProps) => {
  const fileType = value?.split(".").pop();
  if (value && fileType !== "pdf") {
    return (
      <div
        className={cn(
          "relative rounded-md overflow-hidden",
          size === "small" && "w-40 h-auto aspect-square",
          size === "large" && "w-96 h-72 aspect-video"
        )}
      >
        <Image fill src={value} alt="Upload" className="object-cover" />
        <button
          onClick={() => onChange({ key: "", name: "", url: "", size: 0 })}
          className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-2xs"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (value && fileType === "pdf") {
    return (
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 fill-violet-200 stroke-indigo-400" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
        >
          {value}
        </a>
        <button
          onClick={() => onChange({ key: "", name: "", url: "", size: 0 })}
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-2xs"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <UploadDropzone
        endpoint={endpoint}
        onBeforeUploadBegin={(files) => {
          setIsFocused && setIsFocused(true);
          return files;
        }}
        onClientUploadComplete={(res) => {
          onChange({
            key: res?.[0].key,
            name: res?.[0].name,
            url: res?.[0].url,
            size: res?.[0].size,
          });
          setIsFocused && setIsFocused(false);
        }}
        onUploadError={(error: Error) => {
          console.log(error);
        }}
      />
    </div>
  );
};
