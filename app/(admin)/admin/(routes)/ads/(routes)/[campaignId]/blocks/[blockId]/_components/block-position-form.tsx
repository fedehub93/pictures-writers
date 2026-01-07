"use client";
import { AdPositionPlacement, AdPositionReference } from "@/prisma/generated/client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdBlockFormValues } from "@/schemas/ads";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericRadioGroup } from "@/components/form-component/generic-radio-group";

interface BlockPositionFormProps {
  control: Control<AdBlockFormValues>;
  isSubmitting: boolean;
}

export const BlockPositionForm = ({
  control,
  isSubmitting,
}: BlockPositionFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Block Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between gap-x-4 items-center">
          <GenericRadioGroup
            control={control}
            name="placement"
            options={[AdPositionPlacement.BEFORE, AdPositionPlacement.AFTER]}
            label="Placement"
            disabled={isSubmitting}
            containerProps={{ className: "w-3/4" }}
          />
          <GenericInput
            control={control}
            name="referenceCount"
            label="At number"
            type="number"
            containerProps={{ className: "w-1/4" }}
            className="text-right"
            disabled={isSubmitting}
          />
        </div>
        <GenericRadioGroup
          control={control}
          name="reference"
          options={[
            AdPositionReference.HEADING,
            AdPositionReference.HEADING_2,
            AdPositionReference.HEADING_3,
            AdPositionReference.HEADING_4,
            AdPositionReference.PARAGRAPH,
            AdPositionReference.IMAGE,
          ]}
          label="Reference"
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
