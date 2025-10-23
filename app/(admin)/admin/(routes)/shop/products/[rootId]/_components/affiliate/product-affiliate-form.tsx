"use client";

import { Control } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { ProductFormValues } from "@/schemas/product";

interface ProductAffiliateFormProps {
  control: Control<ProductFormValues>;
  isSubmitting: boolean;
}

export const ProductAffiliateForm = ({
  control,
  isSubmitting,
}: ProductAffiliateFormProps) => {
  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          {" "}
          Metadata
        </div>
        <CardTitle className="text-base">Affiliate Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-x-4 items-center">
          <FormField
            control={control}
            name="metadata.url"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel className="block">Link</FormLabel>
                <Input {...field} disabled={isSubmitting} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
