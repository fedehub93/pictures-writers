"use client";

import * as z from "zod";

import { useState } from "react";
import { Control, useController } from "react-hook-form";

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

interface WidgetSearchFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
}

export const WidgetSearchForm = ({
  control,
  isSubmitting,
}: WidgetSearchFormProps) => {
  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          Metadata
        </div>
        <CardTitle className="text-base">Search widget details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-x-4 items-center">
          <FormField
            control={control}
            name="metadata.label"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col w-4/5">
                <FormLabel>Label</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Latest News"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
