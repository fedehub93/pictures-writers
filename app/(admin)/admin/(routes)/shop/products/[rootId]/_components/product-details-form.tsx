"use client";

import { Control, useController } from "react-hook-form";
import slugify from "slugify";

import { Product } from "@/generated/prisma";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { ProductFormValues } from "@/schemas/product";

import { GenericInput } from "@/components/form-component/generic-input";
import { SlugInput } from "@/components/form-component/slug-input";

import { GenericTiptap } from "@/components/form-component/generic-tiptap";

import { ProductCategorySelect } from "./product-category-select";

interface ProductDetailsFormProps {
  control: Control<ProductFormValues>;
  initialData: Product;
  isSubmitting: boolean;
}

export const ProductDetailsForm = ({
  control,
  initialData,
  isSubmitting,
}: ProductDetailsFormProps) => {
  const { field: fieldTitle } = useController({ control, name: "title" });
  const { field: fieldSlug } = useController({ control, name: "slug" });

  const onSlugCreate = () => {
    fieldSlug.onChange(
      slugify(fieldTitle.value, {
        lower: true,
      }),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Product Details <Badge>{initialData.type}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="title"
          label="Name"
          placeholder="Screenplay 101 Ebook"
          disabled={isSubmitting}
        />
        <ProductCategorySelect control={control} isSubmitting={isSubmitting} />
        <SlugInput
          control={control}
          name="slug"
          label="Slug"
          placeholder="screenplay-101"
          disabled={isSubmitting}
          buttonOnClick={onSlugCreate}
        />
        {/* <GenericEditor
          id="description"
          control={control}
          name="description"
          label="Description (Optional)"
          disabled={isSubmitting}
        /> */}
        <GenericTiptap
          key={initialData.id}
          id={initialData.id}
          control={control}
          name="tiptapDescription"
        />
      </CardContent>
    </Card>
  );
};
