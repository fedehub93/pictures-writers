"use client";

import { useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { useMediaInvalidation } from "@/modules/media/hooks/use-media-invalidation";
import { classifyMediaType } from "@/modules/media/lib/media-type";
import type { MediaCleanupStatus } from "@/modules/media/types";

interface ReplaceMediaResponse {
  previousRevisionCleanup?: MediaCleanupStatus;
}

export const ReplaceMediaModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const { invalidateLibrary } = useMediaInvalidation();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isModalOpen = isOpen && type === "replaceMediaAsset";

  const updateFile = (next: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    // The endpoint refuses a type it cannot classify, so the form refuses it
    // first instead of uploading a file the replacement will not accept.
    if (next && !classifyMediaType(next.type)) {
      toast.error(
        "This file type is not supported. Choose an image, document, audio or video file.",
      );
      next = null;
    }

    setFile(next);
    setPreviewUrl(
      next && next.type.startsWith("image/")
        ? URL.createObjectURL(next)
        : null,
    );
  };

  const handleClose = () => {
    updateFile(null);
    onClose();
  };

  const onReplace = async () => {
    if (!data?.id || !file) return;

    try {
      setIsLoading(true);

      // The bytes go through the application transport: the server chooses the
      // active driver, so replacing never needs the UploadThing dropzone.
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<ReplaceMediaResponse>(
        `/api/media/${data.id}/replace`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      toast.success("File replaced");

      if (response.data.previousRevisionCleanup === "skipped") {
        toast(
          "The previous file was left in place because its storage provider is not configured.",
        );
      } else if (response.data.previousRevisionCleanup === "failed") {
        toast(
          "The previous file could not be removed from storage. The new file is being served.",
        );
      }

      handleClose();
      void invalidateLibrary();
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Something went wrong";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = () => {
    if (!file) return null;

    if (previewUrl) {
      return (
        <div className="relative w-96 h-72 rounded-md overflow-hidden">
          <Image
            src={previewUrl}
            alt="Replacement file"
            fill
            className="object-cover"
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center w-96 h-72 rounded-md border border-dashed">
        <span className="text-sm text-zinc-600">{file.name}</span>
      </div>
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Replace file
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Upload a new file for &quot;{data?.name}&quot;. Every content that
            uses this Media keeps its reference and will serve the new file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6">
          <div className="flex items-center justify-center text-center">
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(event) =>
                updateFile(event.target.files?.[0] ?? null)
              }
            />
            {file ? (
              <div className="relative">
                {renderPreview()}
                <button
                  type="button"
                  onClick={() => updateFile(null)}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-2xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-96 h-72 rounded-md border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center text-zinc-500 hover:border-zinc-400 transition"
              >
                <span className="text-sm">Click to select a file</span>
              </button>
            )}
          </div>
        </div>
        <DialogFooter className="bg-gray-100 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isLoading || !file}
            onClick={onReplace}
          >
            {isLoading ? "Replacing..." : "Replace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
