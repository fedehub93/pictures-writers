"use client";

import * as z from "zod";
import { Control } from "react-hook-form";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericTextarea } from "@/components/form-component/generic-textarea";

import { productFormSchema } from "./product-form";

interface ProductSeoFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
  isSubmitting: boolean;
}

export const ProductSeoForm = ({
  control,
  isSubmitting,
}: ProductSeoFormProps) => {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="seo"
      className="border rounded-lg px-4 py-2"
    >
      <AccordionItem value="seo" className="border-b-0">
        <AccordionTrigger className="px-2">SEO</AccordionTrigger>

        <AccordionContent className="space-y-4 px-2">
          <GenericInput
            control={control}
            name={`seo.title`}
            label="Meta title"
            placeholder="Screenplay 101 Ebook"
            disabled={isSubmitting}
          />
          <GenericTextarea
            control={control}
            name="seo.description"
            label="Meta Description"
            placeholder="This ebook talks about..."
            disabled={isSubmitting}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
