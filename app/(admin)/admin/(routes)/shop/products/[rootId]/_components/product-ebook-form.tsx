"use client";

import Image from "next/image";
import { Control, useController } from "react-hook-form";

import { User } from "@/generated/prisma";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ProductFormValues } from "@/schemas/product";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericCalendar } from "@/components/form-component/generic-calendar";

import { EbookFormatsForm } from "./ebook-formats-form";

interface ProductEbookFormProps {
  control: Control<ProductFormValues>;
  authors?: User[];
  isSubmitting: boolean;
}

export const ProductEbookForm = ({
  control,
  authors,
  isSubmitting,
}: ProductEbookFormProps) => {
  const { field: fieldAuthorId } = useController({
    control,
    name: "metadata.author.id",
  });
  const { field: fieldAuthorFirstName } = useController({
    control,
    name: "metadata.author.firstName",
  });
  const { field: fieldAuthorLastName } = useController({
    control,
    name: "metadata.author.lastName",
  });
  const { field: fieldAuthorImageUrl } = useController({
    control,
    name: "metadata.author.imageUrl",
  });

  const onAuthorChange = (id: string) => {
    const author = authors?.find((a) => a.id === id);
    fieldAuthorId.onChange(author?.id);
    fieldAuthorFirstName.onChange(author?.firstName);
    fieldAuthorLastName.onChange(author?.lastName);
    fieldAuthorImageUrl.onChange(author?.imageUrl);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          Metadata
        </div>
        <CardTitle className="text-base">Ebook Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="metadata.author.id"
          render={({ field }) => (
            <FormItem className="flex-1 flex flex-col">
              <FormLabel className="block">Author</FormLabel>
              <Select
                onValueChange={onAuthorChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an author..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {authors?.map((author) => (
                    <SelectItem key={author.id} value={author.id}>
                      <div className="flex gap-x-4 items-center">
                        {author.imageUrl && (
                          <Image
                            src={author.imageUrl}
                            alt="Author image"
                            className="rounded-full"
                            width="32"
                            height="32"
                            unoptimized
                          />
                        )}
                        {author.firstName} {author.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-x-4 items-center">
          <GenericInput
            control={control}
            name="metadata.edition"
            label="Edition"
            disabled={isSubmitting}
            containerProps={{ className: "flex-1 flex flex-col" }}
          />
          <GenericCalendar
            control={control}
            name="metadata.publishedAt"
            label="Publication Date"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex gap-x-4 items-center">
          <EbookFormatsForm
            control={control}
            name="metadata.formats"
            isSubmitting={isSubmitting}
          />
        </div>
      </CardContent>
    </Card>
  );
};
