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

import { useCategoriesFilters } from "../../hooks/use-categories-filters";

interface CategoriesActionsProps {
  id: string;
}

export const CategoriesActions = ({ id }: CategoriesActionsProps) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const [filters] = useCategoriesFilters();
  const router = useRouter();

  const removeCategory = useMutation(
    trpc.categories.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.categories.getMany.queryFilter(filters),
        );
        toast.success("Category deleted successfully!");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = () => {
    removeCategory.mutate({ id });
  };

  const { isPending } = removeCategory;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link href={`/admin/categories/${id}`}>
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
