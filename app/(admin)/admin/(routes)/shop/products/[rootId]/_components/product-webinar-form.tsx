"use client";

import { Control } from "react-hook-form";

import { User } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ProductFormValues } from "@/schemas/product";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericCalendar } from "@/components/form-component/generic-calendar";

interface ProductWebinarFormProps {
  control: Control<ProductFormValues>;
  authors?: User[];
  isSubmitting: boolean;
}

export const ProductWebinarForm = ({
  control,
  authors,
  isSubmitting,
}: ProductWebinarFormProps) => {
  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          Metadata
        </div>
        <CardTitle className="text-base">Webinar Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-x-4 items-center w-full">
          <GenericCalendar
            control={control}
            name={"metadata.startDate"}
            label={"Start date"}
            disabled={isSubmitting}
          />
          <GenericInput
            control={control}
            name={`metadata.time`}
            label="Lesson Time"
            placeholder="21:00"
            disabled={isSubmitting}
            containerProps={{ className: "flex flex-col w-1/4" }}
          />
          <GenericCalendar
            control={control}
            name={"metadata.endDate"}
            label={"End date"}
            disabled={isSubmitting}
          />
          <GenericInput
            control={control}
            name={`metadata.lessons`}
            label="Total Lessons"
            placeholder="10"
            disabled={isSubmitting}
            containerProps={{ className: "flex flex-col w-1/4" }}
            className="text-right"
          />
        </div>
        <div className="flex gap-x-4 items-center">
          <GenericInput
            control={control}
            name={`metadata.seats`}
            label="Seats"
            placeholder="15"
            disabled={isSubmitting}
            containerProps={{ className: "flex-1 flex flex-col w-1/4" }}
            className="text-right"
          />
          <GenericInput
            control={control}
            name={`metadata.duration`}
            label="Duration"
            placeholder="2h"
            disabled={isSubmitting}
            containerProps={{ className: "flex-1 flex flex-col w-1/4" }}
          />
          <GenericInput
            control={control}
            name={`metadata.platform`}
            label="Duration"
            placeholder="Google Meet"
            disabled={isSubmitting}
            containerProps={{ className: "flex-1 flex flex-col" }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
