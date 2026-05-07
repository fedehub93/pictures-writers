import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useOpenPage } from "../hooks/use-open-page";
import { useGetPage } from "../hooks/use-get-page";
import { PageForm } from "./page-form";

export const UpdatePageDialog = () => {
  const { isOpen, onClose, id } = useOpenPage();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetPage(id);

  useEffect(() => {
    if (isOpen && id) {
      queryClient.invalidateQueries({ queryKey: ["page", { id }] });
    }
  }, [isOpen, id, queryClient]);

  return (
    <ResponsiveDialog
      title="Edit Page"
      description="Edit the page details"
      open={isOpen}
      onOpenChange={onClose}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2Icon className="size-4 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <PageForm
          onSuccess={() => onClose()}
          onCancel={() => onClose()}
          initialValues={{
            id: data?.id,
            title: data?.title ?? "",
            slug: data?.slug ?? "",
          }}
        />
      )}
    </ResponsiveDialog>
  );
};
