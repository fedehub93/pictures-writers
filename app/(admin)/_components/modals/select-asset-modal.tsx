"use client";

import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

export const SelectAssetModal = () => {
  const { isOpen, onClose, type } = useModal();

  const isModalOpen = isOpen && type === "selectAsset";

  const onSelect = async (url: string) => {
    console.log(url);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl py-4 px-6 font-normal">
            Add existing asset
          </DialogTitle>
          <Separator />
          <div className="flex flex-col gap-y-2 py-4 px-6">
            <span>Search for assets</span>
            <Input />
          </div>
        </DialogHeader>
        <div className="py-4 px-6">Content</div>
      </DialogContent>
    </Dialog>
  );
};
