"use client";

import * as z from "zod";
import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { productFormSchema } from "./product-form";

interface ProductPricingFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
  isSubmitting: boolean;
}

export const ProductPricingForm = ({
  control,
  isSubmitting,
}: ProductPricingFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Price</FormLabel>
              <div className="flex gap-x-4 items-center">
                <div>€</div>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Set a price for your product"
                    className="text-right"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="discountedPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discounted Price</FormLabel>
              <div className="flex gap-x-4 items-center">
                <div>€</div>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Set a discounted price for your product"
                    className="text-right"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
