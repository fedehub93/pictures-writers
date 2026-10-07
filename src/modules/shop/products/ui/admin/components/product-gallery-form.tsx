"use client";

import Image from "next/image";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { PlusCircle, X } from "lucide-react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as z from "zod";

import { Media } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

import { productUpdateSchema } from "../../../schemas";
import { useProductsFilters } from "../../../hooks/use-products-filters";

const formSchema = productUpdateSchema.pick({
  id: true,
  rootId: true,
  gallery: true,
});

type FormValues = z.infer<typeof formSchema>;

interface GalleryItem {
  mediaId: string;
  url?: string;
  sort: number;
}

interface ProductGalleryFormProps {
  id: string;
  rootId: string;
  initialData: {
    gallery: {
      mediaId: string;
      sort: number;
      media: { url: string };
    }[];
  };
}

export const ProductGalleryForm = ({
  id,
  rootId,
  initialData,
}: ProductGalleryFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductsFilters();
  const { onOpen } = useModal();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      id,
      rootId,
      gallery: initialData.gallery.map((item) => ({
        mediaId: item.mediaId,
        url: item.media.url,
        sort: item.sort,
      })),
    },
    mode: "onChange",
  });

  const { field } = useController({ control: form.control, name: "gallery" });
  const gallery = (field.value ?? []) as GalleryItem[];

  const { mutate: updateProduct, isPending } = useMutation(
    trpc.products.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        queryClient.invalidateQueries(
          trpc.products.getLastByRootId.queryFilter({ rootId }),
        );
        toast.success("Gallery updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update the gallery");
      },
    }),
  );

  const commit = (next: GalleryItem[]) => {
    field.onChange(next);
    updateProduct({ id, rootId, gallery: next });
  };

  const getImage = (media: Media) => {
    commit([
      ...gallery,
      { mediaId: media.id, url: media.url, sort: gallery.length + 1 },
    ]);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = [...gallery];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    commit(reordered.map((item, index) => ({ ...item, sort: index + 1 })));
  };

  const onHandleRemove = (mediaId: string) => {
    commit(gallery.filter((item) => item.mediaId !== mediaId));
  };

  return (
    <div className="p-2">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="product-gallery" direction="horizontal">
          {(provided) => (
            <div
              className="flex flex-wrap gap-4"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {gallery.map((item, index) => (
                <Draggable
                  key={item.mediaId}
                  draggableId={item.mediaId}
                  index={index}
                >
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className="relative size-24 min-w-24 border rounded-lg overflow-hidden flex items-center justify-center group"
                      style={dragProvided.draggableProps.style as React.CSSProperties}
                    >
                      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-50 group-hover:bg-black transition-opacity">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => onHandleRemove(item.mediaId)}
                          className="absolute h-4 w-4 top-2 right-2 z-30 text-white"
                          disabled={isPending}
                        >
                          <X />
                        </Button>
                      </div>
                      {item.url && (
                        <Image
                          src={item.url}
                          alt={`${item.mediaId}-${index}`}
                          className="object-cover"
                          fill
                          unoptimized
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <div className="h-24 w-24 rounded-lg border-dashed border-2 flex justify-center items-center">
                <Button
                  className="text-muted-foreground hover:bg-transparent h-full w-full"
                  variant="ghost"
                  type="button"
                  size="icon"
                  onClick={() => onOpen("selectAsset", getImage)}
                  disabled={isPending}
                >
                  <PlusCircle className="h-12 w-12" />
                </Button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
