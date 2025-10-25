"use client";

import { useEffect, useState } from "react";
import { Control, useController } from "react-hook-form";

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
import { Skeleton } from "@/components/ui/skeleton";

import { ProductFormValues } from "@/schemas/product";

import { useFormsQuery } from "@/app/(admin)/_hooks/use-forms-query";
import { Form } from "@prisma/client";

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

  const [selectedOption, setSelectedOptions] = useState<
    Form | null | undefined
  >(null);

  const onChangeForm = (value: string) => {
    fieldFormId.onChange(value);
    setSelectedOptions(forms?.find((f) => f.id === value));
  };

  useEffect(() => {
    setSelectedOptions(
      forms ? forms.find((option) => fieldFormId.value === option.id) : null
    );
  }, [forms, fieldFormId]);

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
