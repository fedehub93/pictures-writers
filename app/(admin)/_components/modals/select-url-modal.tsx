"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const SelectUrlModal = () => {
  const { isOpen, onClose, type, onCallback, data } = useModal();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  const isModalOpen = isOpen && type === "selectUrl";

  const onSelect = async () => {
    onCallback(url);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl py-4 px-6 font-normal">
            Add video asset
          </DialogTitle>
          <div className="flex flex-col gap-y-4 px-6">
            <div className="flex flex-col gap-y-2">
              <span>Url</span>
              <Input
                onChange={(e) => {
                  setUrl(e.target.value);
                }}
              />
            </div>
            {data?.showLabel && (
              <div className="flex flex-col gap-y-2">
                <span>Label</span>
                <Input
                  onChange={(e) => {
                    setLabel(e.target.value);
                  }}
                />
              </div>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="bg-gray-100 px-6 py-4">
          <Button type="button" onClick={onSelect}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
