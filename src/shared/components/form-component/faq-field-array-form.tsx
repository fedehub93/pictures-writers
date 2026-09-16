"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { GripVertical, X } from "lucide-react";
import {
  type Control,
  type FieldValues,
  type Path,
  useFieldArray,
} from "react-hook-form";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Button } from "@/shared/ui/button";

import type { FaqItem } from "@/modules/faq";

interface FaqFieldArrayFormProps<T extends FieldValues & { faqs?: FaqItem[] }> {
  control: Control<T>;
  isSubmitting?: boolean;
}

export const FaqFieldArrayForm = <
  T extends FieldValues & { faqs?: FaqItem[] },
>({
  control,
  isSubmitting = false,
}: FaqFieldArrayFormProps<T>) => {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "faqs" as never,
  });

  const faqFields = fields as unknown as (FaqItem & { id: string })[];

  const onAddFAQ = () => {
    append({ question: "", answer: "", sort: faqFields.length + 1 } as never);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = [...faqFields];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedOrder = reordered.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));

    replace(updatedOrder as never);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="faq-list" direction="vertical">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-4 w-full"
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqFields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className="flex gap-x-4 items-start"
                    >
                      <div
                        {...dragProvided.dragHandleProps}
                        className="mt-4 shrink-0 cursor-grab text-muted-foreground"
                      >
                        <GripVertical className="size-4" />
                      </div>

                      <AccordionItem
                        value={field.id}
                        className="flex-1 space-y-4 border px-4 py-0 rounded-md"
                      >
                        <AccordionTrigger className="w-full flex justify-between">
                          {field.question}
                        </AccordionTrigger>

                        <AccordionContent className="space-y-4 px-2">
                          <div className="flex flex-col gap-y-4 w-full">
                            <GenericInput
                              control={control}
                              name={`faqs.${index}.question` as Path<T>}
                              label="Question"
                              placeholder="Why should I enroll this workshop?"
                              disabled={isSubmitting}
                            />
                            <GenericInput
                              control={control}
                              name={`faqs.${index}.answer` as Path<T>}
                              label="Answer"
                              placeholder="This is an answer..."
                              disabled={isSubmitting}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <Button
                        size="icon"
                        variant="destructive"
                        type="button"
                        className="h-6 w-6 mt-4 shrink-0"
                        onClick={() => remove(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </Draggable>
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
  );
};
