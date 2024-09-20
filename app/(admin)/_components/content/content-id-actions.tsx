"use client";

import axios from "axios";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";

import { Button } from "@/components/ui/button";

interface ContentIdActionsProps {
  contentType: SeoContentTypeApi;
  contentRootId: string;
  contentId: string;
}

export const ContentIdActions = ({
  contentType,
  contentRootId,
  contentId,
}: ContentIdActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`/api/${contentType}/${contentRootId}/versions/${contentId}`);

      toast.success("Item deleted!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.push(`/admin/${contentType}`);
      router.refresh();
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal onConfirm={onDelete}>
      <Button size="sm" variant="destructive" disabled={isLoading}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </ConfirmModal>
  );
};
