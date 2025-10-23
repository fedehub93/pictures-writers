"use client";

import { Control, useController } from "react-hook-form";

import { ProductAcquisitionMode } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ProductFormValues } from "@/schemas/product";

import { GenericSelect } from "@/components/form-component/generic-select";
import { GenericMoneyInput } from "@/components/form-component/generic-money-input";

interface ProductPricingFormProps {
  control: Control<ProductFormValues>;
  isSubmitting: boolean;
}

export const ProductPricingForm = ({
  control,
  isSubmitting,
}: ProductPricingFormProps) => {
  const { field: fieldAcquisition } = useController({
    control,
    name: "acquisitionMode",
  });

  const isPriceDisabled =
    isSubmitting || fieldAcquisition.value !== ProductAcquisitionMode.PAID;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericSelect
          control={control}
          name="acquisitionMode"
          label="Acquisition Mode"
          options={[
            ProductAcquisitionMode.FREE,
            ProductAcquisitionMode.PAID,
            ProductAcquisitionMode.FORM,
            ProductAcquisitionMode.AFFILIATE,
          ]}
        />
        <GenericMoneyInput
          control={control}
          name="price"
          label="Price"
          placeholder="Set a price for your product"
          disabled={isPriceDisabled}
        />
        <GenericMoneyInput
          control={control}
          name="discountedPrice"
          label="Discounted price"
          placeholder="Set a discounted price for your product"
          disabled={isPriceDisabled}
        />
      </CardContent>
    </Card>
  );
};
