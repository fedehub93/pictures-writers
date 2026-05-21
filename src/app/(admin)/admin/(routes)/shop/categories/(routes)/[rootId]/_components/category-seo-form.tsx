"use client";

import * as z from "zod";
import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductCategoryFormValues } from "@/schemas/product-category";

interface CategorySeoFormProps {
  control: Control<ProductCategoryFormValues>;
  isSubmitting: boolean;
}

export const CategorySeoForm = ({
  control,
  isSubmitting,
}: CategorySeoFormProps) => {
  return (
    <Accordion
      type="single"
      collapsible
      className="border rounded-lg px-4 py-2"
    >
      <AccordionItem value="seo" className="border-b-0">
        <AccordionTrigger className="px-2">SEO</AccordionTrigger>

        <AccordionContent className="space-y-4 px-2">
          <FormField
            control={control}
            name="seo.title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Screenplay 101 Ebook"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="seo.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="This ebook talks about..."
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
