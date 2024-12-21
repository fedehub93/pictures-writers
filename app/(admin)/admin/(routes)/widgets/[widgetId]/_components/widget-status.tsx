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

interface WidgetStatusViewProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
}

export const WidgetStatusView = ({
  control,
  isSubmitting,
}: WidgetStatusViewProps) => {
  return (
    <div className=" rounded-md transition flex flex-col gap-y-4">
      <div className="flex flex-col w-full items-center justify-between">
        <FormField
          control={control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Is enabled?</FormLabel>
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
      </div>
    </div>
  );
};
