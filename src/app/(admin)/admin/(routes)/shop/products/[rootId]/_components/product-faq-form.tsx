"use client";

import type { Control } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";

import { FaqFieldArrayForm } from "@/shared/components/form-component/faq-field-array-form";
import type { ProductFormValues } from "@/schemas/product";

interface ProductFAQFormProps {
  control: Control<ProductFormValues>;
  isSubmitting: boolean;
}

export const ProductFAQForm = ({
  control,
  isSubmitting,
}: ProductFAQFormProps) => (
  <Accordion
    type="single"
    collapsible
    defaultValue="faq"
    className="border rounded-lg px-4 py-2"
  >
    <AccordionItem value="faq" className="border-b-0">
      <AccordionTrigger className="px-2">FAQ</AccordionTrigger>

      <AccordionContent className="px-2">
        <FaqFieldArrayForm control={control} isSubmitting={isSubmitting} />
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);
