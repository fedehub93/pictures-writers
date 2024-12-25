"use client";

import * as z from "zod";

import { ChangeEvent, useEffect, useState } from "react";
import { Control, useController } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { WidgetProductType } from "@/types";
import { widgetFormSchema } from "../widget-form";
import { ProductTypeForm } from "./product-type-form";

interface WidgetProductFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
}

export const WidgetProductForm = ({
  control,
  isSubmitting,
}: WidgetProductFormProps) => {
  const [isDisabledSpecificProduct, setIsDisabledSpecificProduct] =
    useState(false);
  const { field: fieldType } = useController({
    control,
    name: "metadata.productType",
  });
  const { field: fieldLimit } = useController({
    control,
    name: "metadata.limit",
  });

  const onLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldLimit.onChange(Number.parseInt(e.target.value));
  };

  useEffect(() => {
    setIsDisabledSpecificProduct(
      fieldType.value !== WidgetProductType.SPECIFIC
    );
  }, [fieldType.value]);

  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          Metadata
        </div>
        <CardTitle className="text-base">Product widget details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="metadata.label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Latest Products"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ProductTypeForm
          control={control}
          isSubmitting={isSubmitting}
          isDisabled={isDisabledSpecificProduct}
        />
      </CardContent>
    </Card>
  );
};
