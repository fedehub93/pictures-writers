"use client";

import * as z from "zod";
import { useRouter } from "next/navigation";
import { Control, useController } from "react-hook-form";
import { productFormSchema } from "./product-form";
import { EbookFormat } from "@/types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FileForm } from "./file-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EbookFormatsFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
  name: "metadata.formats";
}

export const EbookFormatsForm = ({ control, name }: EbookFormatsFormProps) => {
  const router = useRouter();

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
            <AccordionTrigger className="uppercase">{format.type}</AccordionTrigger>

            <AccordionContent className="space-y-4 px-2">
              <FormField
                control={control}
                name={`metadata.formats.${index}.type`}
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-col gap-y-2">
                      <FormControl>
                        <Input
                          disabled
                          type="hidden"
                          placeholder="Ebook type"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FileForm
                control={control}
                name={`metadata.formats.${index}.url`}
                sizeName={`metadata.formats.${index}.size`}
              />
              <div className="flex gap-x-4">
                <FormField
                  control={control}
                  name={`metadata.formats.${index}.pages`}
                  render={({ field }) => {
                    return (
                      <FormItem className="flex flex-col gap-y-2 flex-1">
                        <FormLabel>Pages</FormLabel>
                        <FormControl>
                          <Input placeholder="Ebook Pages" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={control}
                  name={`metadata.formats.${index}.size`}
                  render={({ field }) => {
                    return (
                      <FormItem className="flex flex-col gap-y-2 flex-1">
                        <FormLabel>Size</FormLabel>
                        <FormControl>
                          <Input disabled placeholder="Ebook Size" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
