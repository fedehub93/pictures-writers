"use client";

import { Control, useFieldArray } from "react-hook-form";
import { User } from "@/generated/prisma";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

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
  const { fields, append, remove } = useFieldArray({
    control,
    name: "metadata.lessons",
  });

  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          Metadata
        </div>
        <CardTitle className="text-base">Webinar Details</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Campi base */}
        <div className="flex gap-x-4 items-center">
          <GenericInput
            control={control}
            name="metadata.platform"
            label="Platform"
            placeholder="Zoom / Google Meet"
            disabled={isSubmitting}
            containerProps={{ className: "flex-1" }}
          />
          <GenericInput
            control={control}
            name="metadata.seats"
            label="Seats"
            placeholder="15"
            disabled={isSubmitting}
            containerProps={{ className: "flex-1" }}
          />
        </div>

        {/* Lezioni dinamiche */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Lessons</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  title: "",
                  date: new Date(),
                  startTime: "",
                  endTime: "",
                })
              }
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Lesson
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((lesson, index) => (
              <div
                key={lesson.id}
                className="flex flex-wrap gap-4 border p-3 rounded-md relative"
              >
                <GenericInput
                  control={control}
                  name={`metadata.lessons.${index}.title`}
                  label="Title"
                  placeholder="Optional title"
                  disabled={isSubmitting}
                  containerProps={{ className: "flex-1" }}
                />

                <GenericCalendar
                  control={control}
                  name={`metadata.lessons.${index}.date`}
                  label="Date"
                  disabled={isSubmitting}
                />

                <GenericInput
                  control={control}
                  name={`metadata.lessons.${index}.startTime`}
                  label="Start"
                  placeholder="18:00"
                  disabled={isSubmitting}
                  containerProps={{ className: "flex-1" }}
                />

                <GenericInput
                  control={control}
                  name={`metadata.lessons.${index}.endTime`}
                  label="End"
                  placeholder="20:00"
                  disabled={isSubmitting}
                  containerProps={{ className: "flex-1" }}
                />

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2"
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
