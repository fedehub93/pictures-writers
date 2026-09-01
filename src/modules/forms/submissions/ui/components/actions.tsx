"use client";

import { EyeIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
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

interface SubmissionsActions {
  id: string;
}

export const SubmissionsActions = ({ id }: SubmissionsActions) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const router = useRouter();

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
          <Button variant="ghost" size="icon" className="size-8">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={`/admin/submissions/${id}`}>
            <DropdownMenuItem>
              <EyeIcon />
              View
            </DropdownMenuItem>
          </Link>

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
