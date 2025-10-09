"use client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdBlockFormValues } from "@/schemas/ads";

import { GenericInput } from "@/components/form-component/generic-input";

interface BlockVisibilityFormProps {
  control: Control<AdBlockFormValues>;
  isSubmitting: boolean;
}

export const BlockVisibilityForm = ({
  control,
  isSubmitting,
}: BlockVisibilityFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Block Visibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="minWords"
          label="Minimum words"
          type="number"
          className="text-right"
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
