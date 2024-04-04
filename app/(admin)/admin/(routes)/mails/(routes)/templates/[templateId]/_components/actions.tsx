"use client";

import { Trash2 } from "lucide-react";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { Button } from "@/components/ui/button";

interface EmailTemplateActionsProps {
  isLoading: boolean;
  onSave: () => void;
  onDelete: () => void;
}

export const EmailTemplateActions = ({
  isLoading,
  onSave,
  onDelete,
}: EmailTemplateActionsProps) => {
  return (
    <div className="flex gap-x-2">
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" variant="destructive" disabled={isLoading}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </ConfirmModal>
      <Button size="sm" onClick={onSave} disabled={isLoading}>
        Save template
      </Button>
    </div>
  );
};
