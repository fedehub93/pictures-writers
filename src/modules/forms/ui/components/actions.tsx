"use client";

import {
  BlocksIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { FormsGetMany } from "../../types";
import { useOpenForm } from "../../hooks/use-open-form";

interface FormsActions {
  id: string;
  data: FormsGetMany[number];
}

export const FormsActions = ({ id, data }: FormsActions) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const router = useRouter();

  const { onOpen } = useOpenForm();

  const onEdit = () => {
    onOpen(data);
  };

  const removeForm = useMutation(
    trpc.forms.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.forms.getMany.queryOptions());
        toast.success("Form deleted successfully!");
        router.refresh();
      },
    }),
  );

  const onDelete = async () => {
    removeForm.mutate({ id });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-4 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <Link href={`/admin/forms/${id}/builder`}>
            <DropdownMenuItem>
              <BlocksIcon className="size-4 mr-2" />
              Form Builder
            </DropdownMenuItem>
          </Link>

          <DropdownMenuSeparator />
          <ConfirmModal onConfirm={onDelete}>
            <Button
              variant="ghost"
              className="bg-destructive px-2! w-full justify-start text-destructive-foreground gap-0"
            >
              <Trash2Icon className="size-4 mr-2" />
              Delete
            </Button>
          </ConfirmModal>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
