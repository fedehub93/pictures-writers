"use client";

import * as z from "zod";

import { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { widgetFormSchema } from "../widget-form";
import { PopupProductForm } from "./product-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { WidgetProductPopActionType } from "@/types";

interface WidgetPopupFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
}

export const WidgetPopupForm = ({
  control,
  isSubmitting,
}: WidgetPopupFormProps) => {
  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          Metadata
        </div>
        <CardTitle className="text-base">Pop-up widget details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <FormField
            control={control}
            name="metadata.label"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel>Label</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Newsletter"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex gap-x-4">
            <FormField
              control={control}
              name="metadata.actionType"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Action Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormItem className="flex items-center space-y-0 space-x-2">
                        <RadioGroupItem value={WidgetProductPopActionType.GO_TO_PRODUCT} />
                        <FormLabel>Go to product page</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-y-0 space-x-2">
                        <RadioGroupItem value={WidgetProductPopActionType.FILL_FORM} />
                        <FormLabel>Fill form</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="metadata.autoOpenDelay"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Auto-open delay (s)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      min={1}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <PopupProductForm control={control} isSubmitting={isSubmitting} />
        </div>
      </CardContent>
    </Card>
  );
};
