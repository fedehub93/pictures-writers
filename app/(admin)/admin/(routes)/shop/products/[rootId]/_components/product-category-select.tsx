"use client";

import { useEffect, useState } from "react";
import { Control, useController } from "react-hook-form";

import { ContentStatus, ProductCategory } from "@prisma/client";

import { cn } from "@/lib/utils";

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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { ProductFormValues } from "@/schemas/product";

import { useProductCategoriesQuery } from "@/app/(admin)/_hooks/use-product-categories";

interface ProductCategorySelectProps {
  control: Control<ProductFormValues>;
  isSubmitting: boolean;
}

export const ProductCategorySelect = ({
  control,
  isSubmitting,
}: ProductCategorySelectProps) => {
  const { data: categories, isLoading, isError } = useProductCategoriesQuery();
  const { field: fieldCategoryId } = useController({
    control,
    name: "categoryId",
  });

  const [selectedOption, setSelectedOptions] = useState<
    ProductCategory | null | undefined
  >(null);

  const onChangeCategory = (value: string) => {
    fieldCategoryId.onChange(value);
    setSelectedOptions(categories?.find((category) => category.id === value));
  };

  useEffect(() => {
    setSelectedOptions(
      categories
        ? categories.find((option) => fieldCategoryId.value === option.id)
        : null
    );
  }, [categories, fieldCategoryId]);

  if (isError) {
    return (
      <div className="flex flex-col gap-2">Error fetching categories.</div>
    );
  }

  return (
    <div>
      <FormField
        control={control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Category</FormLabel>
              {selectedOption && (
                <Badge
                  className={cn(
                    selectedOption?.status === ContentStatus.DRAFT &&
                      "bg-slate-700",
                    selectedOption?.status === ContentStatus.CHANGED &&
                      "bg-sky-700",
                    selectedOption?.status === ContentStatus.PUBLISHED &&
                      "bg-emerald-700"
                  )}
                >
                  {selectedOption?.status === ContentStatus.PUBLISHED
                    ? "Published"
                    : selectedOption?.status === ContentStatus.CHANGED
                    ? "Changed"
                    : "Draft"}
                </Badge>
              )}
            </div>
            {isLoading && <Skeleton className="w-full h-10" />}
            {categories && (
              <Select
                onValueChange={onChangeCategory}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((option) => {
                    return (
                      <SelectItem
                        key={option.title}
                        value={option.id}
                        className="w-full flex items-center justify-between"
                      >
                        {option.title}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
