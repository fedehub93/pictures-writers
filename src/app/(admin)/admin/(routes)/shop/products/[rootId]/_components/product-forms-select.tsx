"use client";

import { type Control, useController } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

import { ProductFormValues } from "@/schemas/product";

import { useFormsQuery } from "@/modules/forms/hooks/use-forms";

interface ProductFormsSelectProps {
  control: Control<ProductFormValues>;
  isSubmitting: boolean;
}

export const ProductFormsSelect = ({
  control,
  isSubmitting,
}: ProductFormsSelectProps) => {
  const { data: forms, isLoading, isError } = useFormsQuery();
  const { field: fieldFormId } = useController({
    control,
    name: "formId",
  });

  const onChangeForm = (value: string) => {
    fieldFormId.onChange(value);
  };

  if (isError) {
    return <div className="flex flex-col gap-2">Error fetching forms.</div>;
  }

  return (
    <div>
      <FormField
        control={control}
        name="formId"
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Form</FormLabel>
            </div>
            {isLoading && <Skeleton className="w-full h-10" />}
            {forms && (
              <Select
                onValueChange={onChangeForm}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {forms.map((option) => {
                    return (
                      <SelectItem
                        key={option.name}
                        value={option.id}
                        className="w-full flex items-center justify-between"
                      >
                        {option.name}
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
