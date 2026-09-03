"use client";

import {
  BlocksIcon,
  EyeIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

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

import { PagesGetMany } from "../../types";
import { usePagesFilters } from "../../hooks/use-pages-filters";
import { useOpenPageSettings } from "../../hooks/use-open-page-settings";

interface PagesAction {
  id: string;
  rootId: string;
  status: ContentStatus;
  data: PagesGetMany["items"][number];
}

export const PagesActions = ({ id, rootId, status, data }: PagesAction) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const [filters, _setFilters] = usePagesFilters();
  const router = useRouter();

  const { onOpen } = useOpenPageSettings();

  const onEdit = () => {
    onOpen(data);
  };

  const publishPage = useMutation(
    trpc.pages.publish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.pages.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.pages.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Page published successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to publish the page");
      },
    }),
  );

  const unPublishPage = useMutation(
    trpc.pages.unpublish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.pages.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.pages.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Page unpublished successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to unpublish the page");
      },
    }),
  );

  const onTogglePublish = () => {
    const mustPublish = status !== ContentStatus.PUBLISHED;
    if (mustPublish) {
      return publishPage.mutate({ id, rootId });
    }
    return unPublishPage.mutate({ id });
  };

  const removePage = useMutation(
    trpc.pages.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.pages.getMany.queryOptions(filters));
        toast.success("Page deleted successfully!");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = async () => {
    removePage.mutate({ id });
  };

  const { isPending } = removePage;

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
            <Link href={`/admin/pages/${rootId}/builder`}>
              <BlocksIcon />
              Page Builder
            </Link>
          </DropdownMenuItem>
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
