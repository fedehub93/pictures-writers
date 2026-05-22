"use client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { FormFormValues } from "@/schemas/form";
import { GenericTextarea } from "@/shared/components/form-component/generic-textarea";

interface FormDetailsProps {
  control: Control<FormFormValues>;
  isSubmitting: boolean;
}

export const FormDetails = ({ control, isSubmitting }: FormDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Form Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="name"
          label="Name"
          disabled={isSubmitting}
        />
        <GenericTextarea
          control={control}
          name="fields"
          label="Fields"
          disabled={isSubmitting}
        />
        <GenericInput
          control={control}
          name="submitLabel"
          label="CTA Label"
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
