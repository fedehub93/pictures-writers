"use client";

import * as z from "zod";
import { Control } from "react-hook-form";

import { Widget } from "@/generated/prisma";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";

import { widgetFormSchema } from "./widget-form";

interface WidgetDetailsFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  initialData: Widget;
  isSubmitting: boolean;
}

export const WidgetDetailsForm = ({
  control,
  initialData,
  isSubmitting,
}: WidgetDetailsFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Widget Details <Badge>{initialData.section!}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Search Box"
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
