"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as z from "zod";

import { Media } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

import { productUpdateSchema } from "../../../schemas";
import { useProductsFilters } from "../../../hooks/use-products-filters";

const formSchema = productUpdateSchema.pick({
  id: true,
  rootId: true,
  imageCoverId: true,
});

type FormValues = z.infer<typeof formSchema>;

interface ProductImageFormProps {
  id: string;
  rootId: string;
  initialData: {
    imageCover: Media | null;
  };
}

export const ProductImageForm = ({
  id,
  rootId,
  initialData,
}: ProductImageFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductsFilters();
  const { onOpen } = useModal();

  const [previewMedia, setPreviewMedia] = useState<Media | null>(
    initialData.imageCover,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      id,
      rootId,
      imageCoverId: initialData.imageCover?.id ?? null,
    },
    mode: "onChange",
  });

  const { mutate: updateProduct, isPending } = useMutation(
    trpc.products.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        queryClient.invalidateQueries(
          trpc.products.getLastByRootId.queryFilter({ rootId }),
        );
        toast.success("Cover image updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update the cover image");
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    updateProduct({ ...dirtyData, id, rootId });
  });

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
              <DropdownMenuItem onSelect={onHandleRemove} disabled={isPending}>
                <Trash2Icon className="size-4 mr-2" />
                Remove
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
          <div className="relative aspect-video w-full">
            <Image
              alt={previewMedia.altText || "Cover image"}
              fill
              className="object-cover rounded-md"
              src={previewMedia.url}
              unoptimized
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
