"use client";
import { Organization } from "@prisma/client";

import * as z from "zod";
import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { organizationFormSchema } from "./organization-form";

import { GenericInput } from "@/components/form-component/generic-input";

interface OrganizationDetailsFormProps {
  control: Control<z.infer<typeof organizationFormSchema>>;
  initialData: {
    name: string;
  };
  isSubmitting: boolean;
}

export const OrganizationDetailsForm = ({
  control,
  initialData,
  isSubmitting,
}: OrganizationDetailsFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Organization Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="name"
          label="Name"
          placeholder="e.g. Pictures Writers"
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
