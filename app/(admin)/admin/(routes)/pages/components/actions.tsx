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
import { ContentStatus } from "@/generated/prisma";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useOpenPage } from "../hooks/use-open-page";

export const PagesActions = ({
  rootId,
  id,
  status,
}: {
  rootId: string;
  id: string;
  status: ContentStatus;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { onOpen } = useOpenPage();
  const queryClient = useQueryClient();

  const togglePublish = useMutation({
    mutationFn: (payload: {
      rootId: string;
      id: string;
      status: ContentStatus;
    }) => {
      const endpoint =
        status === ContentStatus.PUBLISHED ? "unpublish" : "publish";
      return axios.patch(
        `/api/admin/pages/${payload.rootId}/versions/${payload.id}/${endpoint}`,
      );
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["pages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["page", { id }],
      });
      router.refresh();
      const nextStatus = status === ContentStatus.PUBLISHED;
      toast.success(
        nextStatus
          ? "Page unpublished successfully"
          : "Page published successfully",
      );
    },
    onError: async (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to change publication status",
      );
    },
  });

  const deletePage = useMutation({
    mutationFn: ({ rootId, id }: { rootId: string; id: string }) => {
      return axios.delete(`/api/admin/pages/${rootId}/versions/${id}`);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["pages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["page", { id }],
      });
      router.refresh();
      toast.success("Page deleted successfully");
    },
    onError: async (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete page");
    },
  });

  const isPending = togglePublish.isPending || deletePage.isPending;

  const onTogglePublish = () => {
    togglePublish.mutate({ rootId, id, status });
    setIsOpen(false);
  };

  const onDelete = async () => {
    deletePage.mutate({ rootId, id });
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
        {/* <DropdownMenuItem onSelect={() => onOpen(id)} disabled={isPending}>
          <Pencil className="size-4 mr-2" />
          Edit
        </DropdownMenuItem> */}
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
