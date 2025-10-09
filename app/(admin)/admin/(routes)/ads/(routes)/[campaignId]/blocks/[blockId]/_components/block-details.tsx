"use client";
import { AdLayoutType } from "@prisma/client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdBlockFormValues } from "@/schemas/ads";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericRadioGroup } from "@/components/form-component/generic-radio-group";

interface BlockDetailsProps {
  control: Control<AdBlockFormValues>;
  isSubmitting: boolean;
}

export const BlockDetails = ({ control, isSubmitting }: BlockDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Block Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="label"
          label="Label"
          disabled={isSubmitting}
        />
        <GenericRadioGroup
          control={control}
          name="layoutType"
          label="Layout type"
          options={[
            AdLayoutType.SINGLE,
            AdLayoutType.GRID,
            AdLayoutType.CAROUSEL,
          ]}
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
