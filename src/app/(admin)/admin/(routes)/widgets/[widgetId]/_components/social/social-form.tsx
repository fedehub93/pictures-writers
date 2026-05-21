"use client";

import * as z from "zod";

import { Control, useController } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { widgetFormSchema } from "../widget-form";
import { useSocialSettingsQuery } from "@/app/(admin)/_hooks/use-social-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialIcon } from "react-social-icons";
import { Switch } from "@/components/ui/switch";
import { getFirstCharUppercase } from "@/lib/utils";
import { WidgetSocialMetadataSocial } from "@/types";

interface WidgetSocialFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
}

export const WidgetSocialForm = ({
  control,
  isSubmitting,
}: WidgetSocialFormProps) => {
  const { data, isFetching, isError } = useSocialSettingsQuery({
    onlyActive: true,
  });

  const { field: fieldSocials } = useController({
    control,
    name: "metadata.socials",
  });

  if (isFetching)
    return (
      <Card className="mt-6">
        <CardHeader className="relative">
          <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
            Metadata
          </div>
          <CardTitle className="text-base">Social widget details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="w-full h-[40px]" />
          <Skeleton className="w-full h-[40px]" />
          <Skeleton className="w-full h-[40px]" />
        </CardContent>
      </Card>
    );
  if (!data || isError) return <div>Error...</div>;

  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          Metadata
        </div>
        <CardTitle className="text-base">Social widget details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-x-4 items-center">
          <FormField
            control={control}
            name="metadata.label"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel>Label</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Socials"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          {fieldSocials.value.map(
            (field: WidgetSocialMetadataSocial, index: number) => (
              <div key={field.key} className="flex gap-x-4 items-center w-full">
                <FormField
                  control={control}
                  name={`metadata.socials`}
                  render={({ field: fieldSocials }) => (
                    <FormItem className="flex flex-1 flex-row gap-x-4 items-center justify-between rounded-lg border p-4">
                      <SocialIcon
                        network={field.key.toLowerCase()}
                        style={{ height: 45, width: 45 }}
                      />
                      <div className="space-y-0.5 mr-auto">
                        <FormLabel className="text-base">
                          {getFirstCharUppercase(field.key)}
                        </FormLabel>
                        <FormDescription>
                          Show your {getFirstCharUppercase(field.key)} social
                          button link.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={fieldSocials.value[index].isVisible}
                          onCheckedChange={(checked) => {
                            const updatedSocials = [...fieldSocials.value];
                            updatedSocials[index].isVisible = checked;
                            fieldSocials.onChange(updatedSocials);
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};
