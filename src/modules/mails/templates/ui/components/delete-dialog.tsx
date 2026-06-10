"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useTRPC } from "@/trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface DeleteTemplateDialogProps {
  templateId: string;
  templateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const DeleteTemplateDialog = ({
  templateId,
  templateName,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTemplateDialogProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteTemplate = useMutation(
    trpc.templates.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.templates.getMany.queryOptions()
        );
        toast.success("Template deleted successfully");
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete template");
      },
    })
  );

  const handleDelete = () => {
    deleteTemplate.mutate({ id: templateId });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Template</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the template "{templateName}"? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={deleteTemplate.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTemplate.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
