"use client";
import { AdItemSourceType } from "@/prisma/generated/client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdItemFormValues } from "@/schemas/ads";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericRadioGroup } from "@/components/form-component/generic-radio-group";

interface ItemDetailsProps {
  control: Control<AdItemFormValues>;
  isSubmitting: boolean;
}

export const ItemDetails = ({ control, isSubmitting }: ItemDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Item Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="title"
          label="Label"
          disabled={isSubmitting}
        />
        <GenericRadioGroup
          control={control}
          name="sourceType"
          label="Source type"
          options={[
            AdItemSourceType.STATIC,
            AdItemSourceType.POST,
            AdItemSourceType.PRODUCT,
          ]}
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
