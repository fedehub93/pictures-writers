"use client";

import Link from "next/link";

import {
  CalendarClockIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
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

import { usePostsFilters } from "../../../hooks/use-posts-filters";
import { SchedulePostDialog } from "./schedule-post-dialog";

interface PostsActionsProps {
  id: string;
  rootId: string;
  status: ContentStatus;
  scheduledAt: Date | null;
}

export const PostsActions = ({
  id,
  rootId,
  status,
  scheduledAt,
}: PostsActionsProps) => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const [filters, _] = usePostsFilters();
  const router = useRouter();

  const publishPost = useMutation(
    trpc.posts.publish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Post published successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to publish the post");
      },
    }),
  );

  const unpublishPost = useMutation(
    trpc.posts.unpublish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Post unpublished successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to unpublish the Post");
      },
    }),
  );

  const onTogglePublish = () => {
    const mustPublish = status !== ContentStatus.PUBLISHED;
    if (mustPublish) {
      return publishPost.mutate({ id, rootId });
    }
    return unpublishPost.mutate({ id });
  };

  const cancelSchedulePost = useMutation(
    trpc.posts.cancelSchedule.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Schedule cancelled successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to cancel the schedule");
      },
    }),
  );

  const removePost = useMutation(
    trpc.posts.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryOptions(filters));
        toast.success("Post deleted successfully!");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = async () => {
    removePost.mutate({ id });
  };

  const onCancelSchedule = async () => {
    cancelSchedulePost.mutate({ id, rootId });
  };

  const { isPending } = removePost;

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
          <Link href={`/admin/posts/${rootId}`}>
            <DropdownMenuItem>
              <PencilIcon className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </Link>

          {status === ContentStatus.SCHEDULED ? (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  publishPost.mutate({ id, rootId });
                }}
                disabled={isPending}
              >
                <EyeIcon className="size-4 mr-2" />
                Publish now
              </DropdownMenuItem>
              <SchedulePostDialog
                postId={id}
                rootId={rootId}
                mode="reschedule"
                currentScheduledAt={scheduledAt}
                trigger={
                  <DropdownMenuItem
                    onSelect={(event) => event.preventDefault()}
                    disabled={isPending}
                  >
                    <ClockIcon className="size-4 mr-2" />
                    Reschedule
                  </DropdownMenuItem>
                }
              />
              <ConfirmModal onConfirm={onCancelSchedule}>
                <DropdownMenuItem
                  onSelect={(event) => event.preventDefault()}
                  disabled={isPending}
                >
                  <XIcon className="size-4 mr-2" />
                  Cancel schedule
                </DropdownMenuItem>
              </ConfirmModal>
            </>
          ) : (
            <>
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
              <SchedulePostDialog
                postId={id}
                rootId={rootId}
                mode="schedule"
                trigger={
                  <DropdownMenuItem
                    onSelect={(event) => event.preventDefault()}
                    disabled={isPending}
                  >
                    <CalendarClockIcon className="size-4 mr-2" />
                    Schedule publication
                  </DropdownMenuItem>
                }
              />
            </>
          )}
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
