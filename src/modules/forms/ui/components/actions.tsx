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
import { useFormFilters } from "../../hooks/use-forms-filter";

interface FormsActions {
  id: string;
  data: FormsGetMany[number];
}

export const FormsActions = ({ id, data }: FormsActions) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const [filters, _setFilters] = useFormFilters();
  const router = useRouter();

  const { onOpen } = useOpenForm();

  const onEdit = () => {
    onOpen(data);
  };

  const removeForm = useMutation(
    trpc.forms.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.forms.getMany.queryOptions(filters));
        toast.success("Form deleted successfully!");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = async () => {
    removeForm.mutate({ id });
  };

  const { isPending } = removeForm;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/forms/${id}/builder`}>
              <BlocksIcon />
              Form Builder
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <ConfirmModal onConfirm={onDelete}>
            <Button
              variant="ghost"
              disabled={isPending}
              className="bg-destructive px-2! w-full justify-start text-destructive-foreground"
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </ConfirmModal>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
