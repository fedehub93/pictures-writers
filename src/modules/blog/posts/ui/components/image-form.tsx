"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

import { ContentStatus, Media } from "@/generated/prisma";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";
import { postUpdateSchema, type PostUpdateValues } from "../../schemas";
import { usePostsFilters } from "../../hooks/use-posts-filters";
import { usePostStore } from "../../store/use-post-store";

interface ImageFormProps {
  initialData: {
    status: ContentStatus;
    imageCover: Media | null;
  };
  rootId: string;
  postId: string;
}

export const ImageForm = ({ initialData, rootId, postId }: ImageFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = usePostsFilters();
  const { setStatus } = usePostStore();
  const { onOpen } = useModal();

  const [previewMedia, setPreviewMedia] = useState<Media | null>(
    initialData.imageCover,
  );

  const form = useForm<PostUpdateValues>({
    resolver: zodResolver(postUpdateSchema),
    values: {
      imageCoverId: initialData.imageCover?.id || null,
    },
    mode: "onChange",
  });

  const { mutate: updatePost, isPending } = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        setStatus("saved");
        toast.success("Post updated successfully");
      },
      onError: (error) => {
        setStatus("error");
        toast.error(error.message);
      },
    }),
  );

  const handleAutoSave = useAutoSave(
    form,
    (dirtyData) => {
      setStatus("saving");
      updatePost({
        ...dirtyData,
        id: postId,
        rootId: rootId,
      });
    },
    0,
  );

  const getImage = (media: Media) => {
    setPreviewMedia(media);
    form.setValue("imageCoverId", media.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    handleAutoSave();
  };

  const onHandleRemove = () => {
    setPreviewMedia(null);
    form.setValue("imageCoverId", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    handleAutoSave();
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Image cover</CardTitle>
        {previewMedia && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="size-8 p-0"
                disabled={isPending}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Button
                  variant="ghost"
                  onClick={onHandleRemove}
                  disabled={isPending}
                  className="bg-destructive px-2! w-full justify-start text-destructive-foreground gap-0"
                >
                  <Trash2Icon className="size-4 mr-2" />
                  Remove
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        {!previewMedia ? (
          <div className="flex w-full items-center justify-center h-56 border border-dashed rounded-md">
            <Button
              type="button"
              disabled={isPending}
              onClick={() => onOpen("selectAsset", getImage)}
            >
              Select asset
            </Button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between pt-2">
            <div className="relative aspect-video w-full">
              <Image
                alt={previewMedia.altText || "Cover image"}
                fill
                className="object-cover rounded-md"
                src={previewMedia.url}
                unoptimized
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
