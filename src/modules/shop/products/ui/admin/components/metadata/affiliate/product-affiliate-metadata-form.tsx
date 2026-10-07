"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Form } from "@/shared/ui/form";

import { GenericInput } from "@/shared/components/form-component/generic-input";

import {
  affiliateMetadataSchema,
  productUpdateSchema,
} from "../../../../../schemas";
import { type AffiliateMetadata } from "../../../../../types";
import { useUpdateProductMetadata } from "../../../../../hooks/use-update-product-metadata";

const formSchema = productUpdateSchema.pick({ id: true, rootId: true }).extend({
  metadata: affiliateMetadataSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface ProductAffiliateMetadataFormProps {
  id: string;
  rootId: string;
  initialData?: Omit<AffiliateMetadata, "type">;
}

export const ProductAffiliateMetadataForm = ({
  id,
  rootId,
  initialData,
}: ProductAffiliateMetadataFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      id,
      rootId,
      metadata: {
        type: "AFFILIATE",
        url: initialData?.url ?? "",
      },
    },
    mode: "onChange",
  });

  const { mutate: updateProduct, isPending } = useUpdateProductMetadata({
    rootId,
    successMessage: "Affiliate details updated successfully",
    errorMessage: "Failed to update the affiliate details",
  });

  const onSubmit = form.handleSubmit((values) => {
    updateProduct({ id, rootId, metadata: values.metadata });
  });

  return (
    <Card className="md:p-6 shadow-sm border rounded-xl">
      <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
        <CardTitle className="text-xl font-normal text-foreground">
          Affiliate details
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-y-6">
            <GenericInput
              control={form.control}
              name="metadata.url"
              label="Link"
              placeholder="https://..."
              disabled={isPending}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save affiliate details"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
