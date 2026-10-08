"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

import { useTagsFilters } from "../../hooks/use-tags-filters";

interface TagsActionsProps {
  id: string;
}

export const TagsActions = ({ id }: TagsActionsProps) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const [filters] = useTagsFilters();
  const router = useRouter();

  const removeTag = useMutation(
    trpc.tags.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.tags.getMany.queryFilter(filters));
        toast.success("Tag deleted successfully!");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = () => {
    removeTag.mutate({ id });
  };

  const { isPending } = removeTag;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link href={`/admin/tags/${id}`}>
          <DropdownMenuItem>
            <PencilIcon />
            Edit
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
  );
};
