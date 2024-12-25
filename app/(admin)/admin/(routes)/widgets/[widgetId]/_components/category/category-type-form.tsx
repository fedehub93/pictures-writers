"use client";

import * as z from "zod";
import { ChangeEvent } from "react";
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

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { WidgetCategoryType, WidgetPostType } from "@/types";

import { widgetFormSchema } from "../widget-form";

interface CategoryTypeFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
}

type WidgetCategoryFormType = {
  type: WidgetCategoryType;
  label: string;
};

const types: WidgetCategoryFormType[] = [
  {
    type: WidgetCategoryType.ALL,
    label: "All",
  },
];

export const CategoryTypeForm = ({
  control,
  isSubmitting,
}: CategoryTypeFormProps) => {
  const { field: fieldLimit } = useController({
    control,
    name: "metadata.limit",
  });

  const onLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldLimit.onChange(Number.parseInt(e.target.value));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-x-4 items-center">
        <FormField
          control={control}
          name="metadata.categoryType"
          render={({ field }) => (
            <FormItem className={cn("w-full", "flex-1 flex flex-col w-4/5")}>
              <FormLabel className="block">Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category type..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {types?.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex gap-x-4 items-center">
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="metadata.limit"
          render={({ field }) => (
            <FormItem className={cn("hidden", "flex flex-col w-1/5")}>
              <FormLabel className="block">Limit</FormLabel>
              <Input
                {...field}
                onChange={onLimitChange}
                type="number"
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
