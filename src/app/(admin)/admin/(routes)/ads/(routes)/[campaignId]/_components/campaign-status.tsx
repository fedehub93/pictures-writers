"use client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdCampaignFormValues } from "@/schemas/ads";
import { GenericSwitch } from "@/components/form-component/generic-switch";

interface CampaignStatusProps {
  control: Control<AdCampaignFormValues>;
  isSubmitting: boolean;
}

export const CampaignStatus = ({
  control,
  isSubmitting,
}: CampaignStatusProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Is Active?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericSwitch
          control={control}
          name="isActive"
          description="When enabled this campaign will appear online."
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
