"use client";

import { useRouter } from "next/navigation";
import {
  EyeIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useReviewsFilters } from "../../../hooks/use-reviews-filters";
import {
  useOpenReview,
  type ReviewListItem,
} from "../../../hooks/use-open-review";

export const ReviewsActions = ({ data }: { data: ReviewListItem }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters] = useReviewsFilters();
  const { onOpen } = useOpenReview();
  const canManage = usePermission(PERMISSIONS.REVIEWS_MANAGE);

  const publishReview = useMutation(
    trpc.reviews.publish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.reviews.getMany.queryFilter(filters),
        );
        router.refresh();
        toast.success("Review published successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const unpublishReview = useMutation(
    trpc.reviews.unpublish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.reviews.getMany.queryFilter(filters),
        );
        router.refresh();
        toast.success("Review unpublished successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const removeReview = useMutation(
    trpc.reviews.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.reviews.getMany.queryFilter(filters),
        );
        router.refresh();
        toast.success("Review deleted successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending =
    publishReview.isPending ||
    unpublishReview.isPending ||
    removeReview.isPending;

  const onTogglePublish = () => {
    if (data.status) {
      return unpublishReview.mutate({ id: data.id });
    }
    return publishReview.mutate({ id: data.id });
  };

  const onDelete = () => {
    removeReview.mutate({ id: data.id });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canManage && (
          <DropdownMenuItem onSelect={() => onOpen(data)} disabled={isPending}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
        )}
        {canManage && (
          <DropdownMenuItem onSelect={onTogglePublish} disabled={isPending}>
            {!data.status && (
              <>
                <EyeIcon />
                Publish
              </>
            )}
            {data.status && (
              <>
                <EyeOffIcon />
                Unpublish
              </>
            )}
          </DropdownMenuItem>
        )}
        {canManage && (
          <>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
