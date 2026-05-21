"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

export const MediaActions = () => {
  const { onOpen } = useModal();
  return (
    <Button onClick={() => onOpen("createMediaAsset")}>
      <Plus />
      Create new asset
    </Button>
  );
};
