"use client";
import { AdCampaign } from "@/generated/prisma";

import * as z from "zod";
import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdCampaignFormValues } from "@/schemas/ads";

import { GenericInput } from "@/components/form-component/generic-input";

interface CampaignDetailsProps {
  control: Control<AdCampaignFormValues>;
  isSubmitting: boolean;
}

export const CampaignDetails = ({
  control,
  isSubmitting,
}: CampaignDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Campaign Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="name"
          label="Campaign Name"
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
