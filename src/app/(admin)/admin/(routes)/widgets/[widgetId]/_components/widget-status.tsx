"use client";

import * as z from "zod";
import { Control } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

import { widgetFormSchema } from "./widget-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WidgetStatusViewProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
}

export const WidgetStatusView = ({
  control,
  isSubmitting,
}: WidgetStatusViewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Is Enabled?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row justify-between rounded-lg">
              <div className="space-y-0.5">
                <FormDescription>
                  When enabled this widget will appear online.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
