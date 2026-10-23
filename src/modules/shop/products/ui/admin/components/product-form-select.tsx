"use client";

import "client-only";

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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

import { DEFAULT_PAGE, MAX_PAGE_SIZE } from "../../../constants";

const NO_FORM_VALUE = "__none__";

interface ProductFormSelectProps<T extends FieldValues> {
  control: Control<T>;
  disabled?: boolean;
  onChange?: () => void;
}

export const ProductFormSelect = <T extends FieldValues>({
  control,
  disabled,
  onChange,
}: ProductFormSelectProps<T>) => {
  const trpc = useTRPC();
  const { data, isLoading, isError } = useQuery(
    trpc.forms.getMany.queryOptions({
      page: DEFAULT_PAGE,
      pageSize: MAX_PAGE_SIZE,
    }),
  );
  const forms = data?.items;

  if (isError) {
    return (
      <p className="text-sm text-destructive">Error fetching forms.</p>
    );
  }

  return (
    <Controller
      control={control}
      name={"formId" as Path<T>}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex flex-col gap-y-2">
            <FieldLabel htmlFor="form-rhf-product-form">Form</FieldLabel>
            {isLoading ? (
              <Skeleton className="w-full h-9" />
            ) : (
              <Select
                value={(field.value as string | null) ?? NO_FORM_VALUE}
                onValueChange={(value) => {
                  field.onChange(value === NO_FORM_VALUE ? null : value);
                  onChange?.();
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  id="form-rhf-product-form"
                  className="h-9 w-full shadow-2xs mb-0"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select a form..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={NO_FORM_VALUE}>No form</SelectItem>
                    {(forms ?? []).map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
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
