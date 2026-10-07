"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Form } from "@/shared/ui/form";
import { Separator } from "@/shared/ui/separator";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericCalendar } from "@/shared/components/form-component/generic-calendar";

import { ebookMetadataSchema, productUpdateSchema } from "../../../../../schemas";
import {
  EbookType,
  type EbookFormat,
  type EbookMetadata,
} from "../../../../../types";
import { useUpdateProductMetadata } from "../../../../../hooks/use-update-product-metadata";

import { EbookFormatsForm } from "./ebook-formats-form";

const formSchema = productUpdateSchema.pick({ id: true, rootId: true }).extend({
  metadata: ebookMetadataSchema,
});

export type EbookMetadataFormValues = z.infer<typeof formSchema>;

const normalizeFormats = (formats?: EbookFormat[] | null): EbookFormat[] =>
  Object.values(EbookType).map((type) => {
    const existing = formats?.find((format) => format.type === type);
    return existing ?? { type, url: "", size: 0, pages: 0 };
  });

interface ProductEbookMetadataFormProps {
  id: string;
  rootId: string;
  initialData?: Omit<EbookMetadata, "type">;
}

export const ProductEbookMetadataForm = ({
  id,
  rootId,
  initialData,
}: ProductEbookMetadataFormProps) => {
  const form = useForm<EbookMetadataFormValues>({
    resolver: zodResolver(formSchema),
    values: {
      id,
      rootId,
      metadata: {
        type: "EBOOK",
        formats: normalizeFormats(initialData?.formats),
        edition: initialData?.edition ?? "",
        // JSON metadata returns ISO strings, so rehydrate the calendar value.
        publishedAt: initialData?.publishedAt
          ? new Date(initialData.publishedAt)
          : null,
        author: initialData?.author ?? {
          id: "",
          firstName: "",
          lastName: "",
          imageUrl: "",
        },
      },
    },
    mode: "onChange",
  });

  const { mutate: updateProduct, isPending } = useUpdateProductMetadata({
    rootId,
    successMessage: "Ebook details updated successfully",
    errorMessage: "Failed to update the ebook details",
  });

  const onSubmit = form.handleSubmit((values) => {
    const author = values.metadata.author;
    const hasAuthor =
      author && Boolean(author.firstName || author.lastName || author.imageUrl);

    updateProduct({
      id,
      rootId,
      metadata: {
        ...values.metadata,
        author: hasAuthor ? author : null,
      },
    });
  });

  return (
    <Card className="md:p-6 shadow-sm border rounded-xl">
      <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
        <CardTitle className="text-xl font-normal text-foreground">
          Ebook details
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-y-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <GenericInput
                control={form.control}
                name="metadata.edition"
                label="Edition"
                placeholder="First edition"
                disabled={isPending}
              />
              <GenericCalendar
                control={form.control}
                name="metadata.publishedAt"
                label="Publication date"
                onlyFutureDates={false}
                disabled={isPending}
              />
            </div>

            <EbookFormatsForm control={form.control} disabled={isPending} />

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Author</h3>
              <div className="flex flex-col gap-4 sm:flex-row">
                <GenericInput
                  control={form.control}
                  name="metadata.author.firstName"
                  label="First name"
                  disabled={isPending}
                />
                <GenericInput
                  control={form.control}
                  name="metadata.author.lastName"
                  label="Last name"
                  disabled={isPending}
                />
              </div>
              <GenericInput
                control={form.control}
                name="metadata.author.imageUrl"
                label="Author image URL"
                placeholder="https://..."
                disabled={isPending}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save ebook details"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
