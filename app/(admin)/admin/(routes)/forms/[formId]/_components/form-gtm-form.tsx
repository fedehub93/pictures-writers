"use client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FormFormValues } from "@/schemas/form";
import { GenericInput } from "@/components/form-component/generic-input";

interface FormGtmFormProps {
  control: Control<FormFormValues>;
  isSubmitting: boolean;
}

export const FormGtmForm = ({ control, isSubmitting }: FormGtmFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">GTM Params</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="gtmLabel"
          label="GTM Label"
          placeholder="Form laboratorio di scrittura"
          disabled={isSubmitting}
        />
        <GenericInput
          control={control}
          name="gtmCategory"
          label="GTM Category"
          placeholder="lead"
          disabled={isSubmitting}
        />
        <GenericInput
          control={control}
          name="gtmEventName"
          label="GTM Event Name"
          placeholder="form_submission_laboratorio_gennaio"
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
