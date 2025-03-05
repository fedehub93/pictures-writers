"use client";
import { Media, Product } from "@prisma/client";

import Image from "next/image";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import * as z from "zod";
import { Control, useController } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { productFormSchema } from "./product-form";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { PlusCircle, X } from "lucide-react";

interface ProductGalleryFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
  isSubmitting: boolean;
}

export const ProductGalleryForm = ({
  control,
  isSubmitting,
}: ProductGalleryFormProps) => {
  const { onOpen } = useModal();

  const { field } = useController({ control, name: "gallery" });

  const onSubmit = async ({ id, url, sort }: Media & { sort: number }) => {
    try {
      field.onChange([...field.value, { mediaId: id, url, sort }]);
    } catch {
    } finally {
    }
  };

  const getImage = (data: Media) => {
    onSubmit({ ...data, sort: field.value.length + 1 });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reordered = [...field.value];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Aggiorna l'ordine basato sull'indice attuale
    const updatedOrder = reordered.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));

    field.onChange(updatedOrder);
  };

  const onHandleAddImage = () => {
    onOpen("selectAsset", getImage);
  };

  const onHandleRemove = (id: string) => {
    const newGallery = field.value.filter((v) => v.mediaId !== id);
    field.onChange(newGallery);
  };

  return (
    <Accordion
      type="single"
      collapsible
      className="border rounded-lg px-4 py-2"
    >
      <AccordionItem value="gallery" className="border-b-0">
        <AccordionTrigger className="px-2">Gallery</AccordionTrigger>

        <AccordionContent className="px-2 flex flex-wrap gap-4 items-center">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="image-gallery" direction="horizontal">
              {(provided) => (
                <div
                  className="flex flex-wrap gap-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {field.value.map((fieldMedia, index) => (
                    <Draggable
                      key={fieldMedia.mediaId}
                      draggableId={fieldMedia.mediaId}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="relative h-24 w-24 min-w-24 border rounded-lg overflow-hidden flex items-center justify-center group"
                        >
                          <div className="absolute top-0 left-0 w-0 h-full bg-black z-20 opacity-0 group-hover:opacity-50 group-hover:w-full transition-opacity">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => onHandleRemove(fieldMedia.mediaId)}
                              className="absolute h-4 w-4 top-2 right-2 z-30 text-white"
                            >
                              <X />
                            </Button>
                          </div>
                          <Image
                            src={fieldMedia.url!}
                            alt={`${fieldMedia.mediaId}-${index}`}
                            className="object-cover"
                            fill
                            unoptimized
                          />
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
                      onClick={onHandleAddImage}
                    >
                      <PlusCircle className="h-12 w-12" />
                    </Button>
                  </div>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
