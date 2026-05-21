"use client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdBlockFormValues } from "@/schemas/ads";
import { GenericSwitch } from "@/components/form-component/generic-switch";

interface BlockStatusFormProps {
  control: Control<AdBlockFormValues>;
  isSubmitting: boolean;
}

export const BlockStatusForm = ({
  control,
  isSubmitting,
}: BlockStatusFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Is Active?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericSwitch
          control={control}
          name="isActive"
          description="When enabled this block will appear online."
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
