"use client";

import {
  BlocksIcon,
  EyeIcon,
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

import { FormSubmissionsGetMany } from "../../types";

interface SubmissionsActions {
  id: string;
  data: FormSubmissionsGetMany[number];
}

export const SubmissionsActions = ({ id, data }: SubmissionsActions) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const router = useRouter();

  const onEdit = () => {};

  const removeForm = useMutation(
    trpc.submissions.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.submissions.getMany.queryOptions({}),
        );
        toast.success("Form submission deleted successfully!");
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
          <Button variant="ghost" className="h-4 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={`/admin/submissions/${id}`}>
            <DropdownMenuItem>
              <EyeIcon className="size-4 mr-2" />
              View
            </DropdownMenuItem>
          </Link>

          <DropdownMenuSeparator />
          <ConfirmModal onConfirm={onDelete}>
            <Button
              variant="ghost"
              disabled={isPending}
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
