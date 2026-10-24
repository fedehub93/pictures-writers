"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
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
import {
  FileUpload,
  type FileUploadOnChange,
} from "@/shared/components/file-upload";

export const ReplaceMediaModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();
  const [upload, setUpload] = useState<FileUploadOnChange | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "replaceMediaAsset";

  const handleClose = () => {
    setUpload(null);
    onClose();
  };

  const onReplace = async () => {
    if (!data?.id || !upload?.key) return;

    try {
      setIsLoading(true);

      await axios.post(`/api/media/${data.id}/replace`, {
        key: upload.key,
        mimeType: upload.mimeType,
      });

      toast.success("File replaced");
      handleClose();
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Something went wrong";

      toast.error(message);
    } finally {
      setIsLoading(false);
      router.refresh();
    }
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
            uses this asset keeps its reference and will serve the new file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6">
          <div className="flex items-center justify-center text-center">
            <FileUpload
              endpoint="mediaAsset"
              value={upload?.url}
              onChange={setUpload}
            />
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
            disabled={isLoading || !upload?.key}
            onClick={onReplace}
          >
            {isLoading ? "Replacing..." : "Replace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
