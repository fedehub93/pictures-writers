"use client";

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useDeleteCredential } from "../../hooks/use-credentials";
import { useOpenCredential } from "../../hooks/use-open-credential";
import type { CredentialsGetMany } from "../../types";

interface CredentialActionsProps {
  credential: CredentialsGetMany["items"][number];
}

export const CredentialActions = ({ credential }: CredentialActionsProps) => {
  const { onOpen } = useOpenCredential();
  const deleteCredential = useDeleteCredential();

  const onDelete = () => {
    deleteCredential.mutate(
      { id: credential.id },
      {
        onSuccess: () => {
          toast.success("Credential deleted successfully!");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onOpen(credential)}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ConfirmModal onConfirm={onDelete}>
          <Button
            variant="ghost"
            disabled={deleteCredential.isPending}
            className="bg-destructive px-2! w-full justify-start text-destructive-foreground"
          >
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
