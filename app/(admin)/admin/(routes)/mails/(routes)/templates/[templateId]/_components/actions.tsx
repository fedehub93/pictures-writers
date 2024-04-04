"use client";

import axios from "axios";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { Button } from "@/components/ui/button";

interface EmailTemplateActionsProps {
  templateId: string;
  onSave: () => void;
}

export const EmailTemplateActions = ({
  templateId,
  onSave,
}: EmailTemplateActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`/api/mails/templates/${templateId}`);

      toast.success("Item deleted!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      router.push(`/admin/mails/templates`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-x-2">
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" variant="destructive" disabled={isLoading}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </ConfirmModal>
      <Button
        size="sm"
        className="bg-sky-700"
        onClick={onSave}
      >
        Save template
      </Button>
    </div>
  );
};
