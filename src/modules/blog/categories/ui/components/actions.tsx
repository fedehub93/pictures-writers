"use client";

import {
  EyeIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { ContentStatus } from "@/generated/prisma";

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
import Link from "next/link";

interface CategoriesAction {
  id: string;
  rootId: string;
  status: ContentStatus;
}

export const CategoriesActions = ({
  id,
  rootId,
  status,
}: CategoriesAction) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const [filters, _setFilters] = useCategoriesFilters();
  const router = useRouter();

  const publishCategory = useMutation(
    trpc.categories.publish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.categories.getMany.queryFilter(filters),
        );
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.categories.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Category published successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to publish the category");
      },
    }),
  );

  const unpublishCategory = useMutation(
    trpc.categories.unpublish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.categories.getMany.queryFilter(filters),
        );
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.categories.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Category unpublished successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to unpublish the category");
      },
    }),
  );

  const onTogglePublish = () => {
    const mustPublish = status !== ContentStatus.PUBLISHED;
    if (mustPublish) {
      return publishCategory.mutate({ id, rootId });
    }
    return unpublishCategory.mutate({ id });
  };

  const removeCategory = useMutation(
    trpc.categories.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.categories.getMany.queryOptions(filters),
        );
        toast.success("Category deleted successfully!");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = async () => {
    removeCategory.mutate({ id });
  };

  const { isPending } = removeCategory;

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
          <Link href={`/admin/categories/${rootId}`}>
            <DropdownMenuItem>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
          </Link>

          <DropdownMenuItem
            onSelect={() => {
              onTogglePublish();
            }}
            disabled={isPending}
          >
            {status !== ContentStatus.PUBLISHED && (
              <>
                <EyeIcon />
                Publish
              </>
            )}
            {status === ContentStatus.PUBLISHED && (
              <>
                <EyeOffIcon />
                Unpublish
              </>
            )}
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
