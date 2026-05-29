"use client";

import {
  CloudSyncIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useOpenContact } from "../../hooks/use-open-contact";
import { ContactsGetMany } from "../../types";

export const EmailAudienceContactsAction = ({
  id,
  data,
}: {
  id: string;
  data: ContactsGetMany[number];
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { onOpen } = useOpenContact();

  const onEdit = () => {
    onOpen(data);
  };

  const removeContact = useMutation(
    trpc.contacts.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.contacts.getMany.queryOptions({}));
        toast.success("Contact deleted successfully!");
      },
    }),
  );

  const onDelete = async () => {
    removeContact.mutate({ id });
  };

  const syncWithProvider = useMutation(
    trpc.contacts.sync.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.contacts.getMany.query);
        toast.success("Sync completed!");
      },
      onError: (err) => {
        toast.error(err.message);
      },
      onSettled: () => {
        setIsOpen(false);
      },
    }),
  );

  const isPending = syncWithProvider.isPending;

  const onSyncWithProvider = async () => {
    syncWithProvider.mutate({ id });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-4 w-8 p-0"
          onClick={() => {
            setIsOpen(true);
          }}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit} disabled={isPending}>
          <PencilIcon className="size-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <ConfirmModal onConfirm={onSyncWithProvider}>
          <Button
            variant="ghost"
            className="px-2! w-full justify-start gap-0"
            disabled={isPending}
          >
            <CloudSyncIcon className="size-4 mr-2" />
            Sync with Provider
          </Button>
        </ConfirmModal>
        <DropdownMenuSeparator />
        <ConfirmModal onConfirm={onDelete}>
          <Button
            variant="ghost"
            className="bg-destructive px-2! w-full justify-start text-destructive-foreground gap-0"
            disabled={isPending}
          >
            <Trash2Icon className="size-4 mr-2" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
