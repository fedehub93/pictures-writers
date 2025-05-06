"use client";
import { Product } from "@prisma/client";

import * as z from "zod";
import { Control, useController } from "react-hook-form";
import slugify from "slugify";
import { Descendant } from "slate";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

import Editor from "@/app/(admin)/_components/editor";
import { GenericInput } from "@/components/form-component/generic-input";
import { SlugInput } from "@/components/form-component/slug-input";

import { productFormSchema } from "./product-form";
import { ProductCategorySelect } from "./product-category-select";

interface ProductDetailsFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
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
  const { field: fieldDescription } = useController({
    control,
    name: "description",
  });

  const onSlugCreate = () => {
    fieldSlug.onChange(
      slugify(fieldTitle.value, {
        lower: true,
      })
    );
  };

  const onChangeBody = (value: Descendant[]) => {
    fieldDescription.onChange(value);
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
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Editor {...field} onChange={onChangeBody}>
                  <Editor.Toolbar showEmbedButton={false} padding="xs" />
                  <Editor.Input onHandleIsFocused={() => {}} />
                  <Editor.Counter value={field.value} />
                </Editor>
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
