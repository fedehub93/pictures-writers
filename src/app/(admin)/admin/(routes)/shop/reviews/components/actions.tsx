"use client";

import axios from "axios";
import {
  EyeIcon,
  EyeOffIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useOpenReview } from "../hooks/use-open-review";

export const ReviewsActions = ({
  id,
  status,
}: {
  id: string;
  status: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { onOpen } = useOpenReview();
  const queryClient = useQueryClient();

  const togglePublish = useMutation({
    mutationFn: (payload: { id: string; status: boolean }) => {
      const endpoint = status ? "unpublish" : "publish";
      return axios.patch(`/api/admin/shop/reviews/${payload.id}/${endpoint}`);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews"],
      });
      queryClient.invalidateQueries({
        queryKey: ["review", { id }],
      });
      router.refresh();
      const nextStatus = !status;
      toast.success(
        nextStatus
          ? "Review published successfully"
          : "Review unpublished successfully",
      );
    },
    onError: async (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to change publication status",
      );
    },
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => {
      return axios.delete(`/api/admin/shop/reviews/${id}`);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews"],
      });
      queryClient.invalidateQueries({
        queryKey: ["review", { id }],
      });
      router.refresh();
      toast.success("Review deleted successfully");
    },
    onError: async (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete review");
    },
  });

  const isPending = togglePublish.isPending || deleteReview.isPending;

  const onTogglePublish = () => {
    togglePublish.mutate({ id, status });
    setIsOpen(false);
  };

  const onDelete = async () => {
    deleteReview.mutate(id);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-4 w-8 p-0"
          onClick={() => {
            setIsOpen(true);
          }}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onOpen(id)} disabled={isPending}>
          <Pencil className="size-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onTogglePublish();
          }}
          disabled={isPending}
        >
          {!status && (
            <>
              <EyeIcon className="size-4 mr-2" />
              Publish
            </>
          )}
          {status && (
            <>
              <EyeOffIcon className="size-4 mr-2" />
              Unpublish
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ConfirmModal onConfirm={onDelete}>
          <Button
            className="bg-destructive px-2! w-full justify-start text-destructive-foreground gap-0"
            disabled={isPending}
          >
            <Trash2 className="size-4 mr-2" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
