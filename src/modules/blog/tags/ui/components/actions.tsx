"use client";

import Link from "next/link";

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

import { useTagsFilters } from "../../hooks/use-tags-filters";

interface TagsActionProps {
  id: string;
  rootId: string;
  status: ContentStatus;
}

export const TagsActions = ({ id, rootId, status }: TagsActionProps) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const [filters, _] = useTagsFilters();
  const router = useRouter();

  const publishTag = useMutation(
    trpc.tags.publish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.tags.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.tags.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Tag published successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to publish the tag");
      },
    }),
  );

  const unpublishTag = useMutation(
    trpc.tags.unpublish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.tags.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.tags.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Tag unpublished successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to unpublish the tag");
      },
    }),
  );

  const onTogglePublish = () => {
    const mustPublish = status !== ContentStatus.PUBLISHED;
    if (mustPublish) {
      return publishTag.mutate({ id, rootId });
    }
    return unpublishTag.mutate({ id });
  };

  const removeTag = useMutation(
    trpc.tags.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.tags.getMany.queryOptions(filters));
        toast.success("Tag deleted successfully!");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = async () => {
    removeTag.mutate({ id });
  };

  const { isPending } = removeTag;

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
          <Link href={`/admin/tags/${rootId}`}>
            <DropdownMenuItem>
              <PencilIcon className="size-4 mr-2" />
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
                <EyeIcon className="size-4 mr-2" />
                Publish
              </>
            )}
            {status === ContentStatus.PUBLISHED && (
              <>
                <EyeOffIcon className="size-4 mr-2" />
                Unpublish
              </>
            )}
          </DropdownMenuItem>
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
