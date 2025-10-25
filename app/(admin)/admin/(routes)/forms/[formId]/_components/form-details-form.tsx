"use client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { GenericInput } from "@/components/form-component/generic-input";
import { FormFormValues } from "@/schemas/form";
import { GenericTextarea } from "@/components/form-component/generic-textarea";

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
          label="Form Name"
          disabled={isSubmitting}
        />
        <GenericTextarea
          control={control}
          name="fields"
          label="Json"
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
