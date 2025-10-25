"use client";
import { ProductCategory } from "@prisma/client";

import { Control, useController } from "react-hook-form";
import { Sparkles } from "lucide-react";
import slugify from "slugify";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { ProductCategoryFormValues } from "@/schemas/product-category";

import { GenericTextarea } from "@/components/form-component/generic-textarea";
import { GenericInput } from "@/components/form-component/generic-input";

interface CategoryDetailsProps {
  control: Control<ProductCategoryFormValues>;
  initialData: ProductCategory;
  isSubmitting: boolean;
}

export const CategoryDetails = ({
  control,
  initialData,
  isSubmitting,
}: CategoryDetailsProps) => {
  const { field: fieldTitle } = useController({ control, name: "title" });
  const { field: fieldSlug } = useController({ control, name: "slug" });

  const onSlugCreate = () => {
    fieldSlug.onChange(
      slugify(fieldTitle.value, {
        lower: true,
      })
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Category Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="title"
          label="Name"
          disabled={isSubmitting}
          placeholder="Screenplay 101 Ebook"
        />
        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <div className="flex flex-row gap-x-2">
                  <Input
                    {...field}
                    placeholder="screenplay-101"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onSlugCreate}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <GenericTextarea
          control={control}
          name="description"
          label="Description"
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
