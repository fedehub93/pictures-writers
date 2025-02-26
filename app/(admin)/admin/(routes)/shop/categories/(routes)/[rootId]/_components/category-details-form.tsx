"use client";
import { Product, ProductCategory } from "@prisma/client";

import * as z from "zod";
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
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { CategoryFormSchema } from "./category-form";

interface CategoryDetailsProps {
  control: Control<z.infer<typeof CategoryFormSchema>>;
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
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
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
      </CardContent>
    </Card>
  );
};
