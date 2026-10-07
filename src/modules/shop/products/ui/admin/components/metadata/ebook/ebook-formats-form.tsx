"use client";

import type { Control } from "react-hook-form";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { GenericInput } from "@/shared/components/form-component/generic-input";

import { EbookType } from "../../../../../types";

import type { EbookMetadataFormValues } from "./product-ebook-metadata-form";

interface EbookFormatsFormProps {
  control: Control<EbookMetadataFormValues>;
  disabled?: boolean;
}

export const EbookFormatsForm = ({
  control,
  disabled,
}: EbookFormatsFormProps) => {
  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-2">Formats</div>
      <Accordion type="single" collapsible className="border rounded-lg p-6 py-2">
        {Object.values(EbookType).map((format, index) => (
          <AccordionItem
            key={format}
            value={format}
            className="last:border-b-0"
          >
            <AccordionTrigger className="uppercase">
              {format}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 px-2">
              <GenericInput
                control={control}
                name={`metadata.formats.${index}.url`}
                label="URL"
                placeholder="https://..."
                disabled={disabled}
              />
              <div className="flex gap-x-4">
                <GenericInput
                  control={control}
                  name={`metadata.formats.${index}.pages`}
                  label="Pages"
                  placeholder="0"
                  type="number"
                  disabled={disabled}
                  containerProps={{ className: "flex flex-col gap-y-2 flex-1" }}
                />
                <GenericInput
                  control={control}
                  name={`metadata.formats.${index}.size`}
                  label="Size (bytes)"
                  placeholder="0"
                  type="number"
                  disabled={disabled}
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
