"use client";

import * as z from "zod";
import { Control, useController } from "react-hook-form";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { EbookFormat } from "@/types";

import { GenericInput } from "@/components/form-component/generic-input";

import { productFormSchema } from "./product-form";
import { FileForm } from "./file-form";

interface EbookFormatsFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
  name: "metadata.formats";
  isSubmitting: boolean;
}

export const EbookFormatsForm = ({
  control,
  name,
  isSubmitting,
}: EbookFormatsFormProps) => {
  const { field } = useController({ control, name });

  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-2">Formats</div>
      <Accordion
        type="single"
        collapsible
        className="border rounded-lg p-6 py-2"
      >
        {field.value.map((format: EbookFormat, index: number) => (
          <AccordionItem
            key={format.type}
            value={format.type}
            className="last:border-b-0"
          >
            <AccordionTrigger className="uppercase">
              {format.type}
            </AccordionTrigger>

            <AccordionContent className="space-y-4 px-2">
              <GenericInput
                control={control}
                name={`metadata.formats.${index}.type`}
                label="Type"
                type="hidden"
                placeholder="Ebook type"
                disabled={isSubmitting}
              />
              <FileForm
                control={control}
                name={`metadata.formats.${index}.url`}
                sizeName={`metadata.formats.${index}.size`}
              />
              <div className="flex gap-x-4">
                <GenericInput
                  control={control}
                  name={`metadata.formats.${index}.pages`}
                  label="Pages"
                  placeholder="Ebook pages"
                  disabled={isSubmitting}
                  containerProps={{ className: "flex flex-col gap-y-2 flex-1" }}
                />
                <GenericInput
                  control={control}
                  name={`metadata.formats.${index}.size`}
                  label="Size"
                  placeholder="Ebook size"
                  disabled
                  containerProps={{ className: "flex flex-col gap-y-2 flex-1" }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
