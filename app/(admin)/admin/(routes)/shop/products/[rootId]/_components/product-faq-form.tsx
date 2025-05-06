"use client";

import { PlusCircle, X } from "lucide-react";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import * as z from "zod";
import { Control, useFieldArray } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { productFormSchema } from "./product-form";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProductGalleryFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
  isSubmitting: boolean;
}

export const ProductFAQForm = ({
  control,
  isSubmitting,
}: ProductGalleryFormProps) => {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "faqs",
  });

  const onAddFAQ = () => {
    append({
      question: "",
      answer: "",
      sort: fields.length + 1,
    });
  };

  const onRemoveFAQ = (index: number) => {
    remove(index);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reordered = [...fields];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Aggiorna l'ordine basato sull'indice attuale
    const updatedOrder = reordered.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));

    replace([...updatedOrder]);
  };

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="gallery"
      className="border rounded-lg px-4 py-2"
    >
      <AccordionItem value="gallery" className="border-b-0">
        <AccordionTrigger className="px-2">FAQ</AccordionTrigger>

        <AccordionContent className="px-2 flex flex-wrap gap-4 items-center">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="image-gallery" direction="horizontal">
              {(provided) => (
                <div
                  className="flex flex-col gap-4 w-full"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-4"
                  >
                    {fields.map((field, index) => (
                      <div key={index} className="flex gap-x-4 ">
                        <AccordionItem
                          value={field.id}
                          className="flex-1 space-y-4 border px-4 py-0 rounded-md"
                        >
                          <AccordionTrigger className="w-full flex justify-between">
                            {field.question}
                          </AccordionTrigger>

                          <AccordionContent className="space-y-4 px-2">
                            <div className="flex flex-col gap-y-4 w-full">
                              <FormField
                                control={control}
                                name={`faqs.${index}.question`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Question</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Why should I enroll this workshop?"
                                        {...field}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={control}
                                name={`faqs.${index}.answer`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel>Answer</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="This is an answer..."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <div className="text-right">
                          <Button
                            size="icon"
                            variant="destructive"
                            type="button"
                            className="h-6 w-6"
                            onClick={() => onRemoveFAQ(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </Accordion>
                  {provided.placeholder}
                  <Button type="button" onClick={onAddFAQ} variant="outline">
                    Add a FAQ
                  </Button>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
