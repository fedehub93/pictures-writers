"use client";

import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

import { DEFAULT_PAGE, MAX_PAGE_SIZE } from "../../../constants";

interface ProductCategorySelectProps<T extends FieldValues> {
  control: Control<T>;
  disabled?: boolean;
  onChange?: () => void;
}

export const ProductCategorySelect = <T extends FieldValues>({
  control,
  disabled,
  onChange,
}: ProductCategorySelectProps<T>) => {
  const trpc = useTRPC();
  const { data, isLoading, isError } = useQuery(
    trpc.productCategories.getMany.queryOptions({
      page: DEFAULT_PAGE,
      pageSize: MAX_PAGE_SIZE,
    }),
  );
  const categories = data?.items;

  if (isError) {
    return (
      <p className="text-sm text-destructive">Error fetching categories.</p>
    );
  }

  return (
    <Controller
      control={control}
      name={"categoryId" as Path<T>}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="form-rhf-product-category">
                Category
              </FieldLabel>
            </div>
            {isLoading ? (
              <Skeleton className="w-full h-9" />
            ) : (
              <Select
                value={(field.value as string | null) ?? undefined}
                onValueChange={(value) => {
                  field.onChange(value);
                  onChange?.();
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  id="form-rhf-product-category"
                  className="h-9 w-full shadow-2xs mb-0"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
        </Field>
      )}
    />
  );
};
