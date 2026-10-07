"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Form } from "@/shared/ui/form";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericCalendar } from "@/shared/components/form-component/generic-calendar";
import { GenericSwitch } from "@/shared/components/form-component/generic-switch";

import {
  productUpdateSchema,
  webinarMetadataSchema,
} from "../../../../../schemas";
import { type WebinarMetadata } from "../../../../../types";
import { useUpdateProductMetadata } from "../../../../../hooks/use-update-product-metadata";

const lessonFormSchema = z.object({
  title: z.string().optional(),
  date: z.coerce.date<Date>(),
  startTime: z.string(),
  endTime: z.string(),
});

const formSchema = productUpdateSchema.pick({ id: true, rootId: true }).extend({
  metadata: webinarMetadataSchema.extend({
    lessons: z.array(lessonFormSchema),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductWebinarMetadataFormProps {
  id: string;
  rootId: string;
  initialData?: Omit<WebinarMetadata, "type">;
}

export const ProductWebinarMetadataForm = ({
  id,
  rootId,
  initialData,
}: ProductWebinarMetadataFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      id,
      rootId,
      metadata: {
        type: "WEBINAR",
        seats: initialData?.seats ?? 0,
        platform: initialData?.platform ?? "",
        isOpen: initialData?.isOpen ?? false,
        lessons: (initialData?.lessons ?? []).map((lesson) => ({
          title: lesson.title,
          date: new Date(lesson.date),
          startTime: lesson.startTime,
          endTime: lesson.endTime,
        })),
      },
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "metadata.lessons",
  });

  const { mutate: updateProduct, isPending } = useUpdateProductMetadata({
    rootId,
    successMessage: "Webinar details updated successfully",
    errorMessage: "Failed to update the webinar details",
  });

  const onSubmit = form.handleSubmit((values) => {
    updateProduct({
      id,
      rootId,
      metadata: {
        ...values.metadata,
        lessons: values.metadata.lessons.map((lesson) => ({
          ...lesson,
          date: lesson.date.toISOString(),
        })),
      },
    });
  });

  return (
    <Card className="md:p-6 shadow-sm border rounded-xl">
      <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-xl font-normal text-foreground">
            Webinar details
          </CardTitle>
          <GenericSwitch
            control={form.control}
            name="metadata.isOpen"
            label="Enrollment open"
            disabled={isPending}
          />
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-y-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <GenericInput
                control={form.control}
                name="metadata.platform"
                label="Platform"
                placeholder="Zoom / Google Meet"
                disabled={isPending}
              />
              <GenericInput
                control={form.control}
                name="metadata.seats"
                label="Seats"
                type="number"
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Lessons</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    append({
                      title: "",
                      date: new Date(),
                      startTime: "",
                      endTime: "",
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-1">Add lesson</span>
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No lessons yet.
                </p>
              )}

              {fields.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="relative grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-4"
                >
                  <GenericInput
                    control={form.control}
                    name={`metadata.lessons.${index}.title`}
                    label="Title"
                    placeholder="Optional"
                    disabled={isPending}
                  />
                  <GenericCalendar
                    control={form.control}
                    name={`metadata.lessons.${index}.date`}
                    label="Date"
                    onlyFutureDates={false}
                    disabled={isPending}
                  />
                  <GenericInput
                    control={form.control}
                    name={`metadata.lessons.${index}.startTime`}
                    label="Start"
                    placeholder="18:00"
                    disabled={isPending}
                  />
                  <GenericInput
                    control={form.control}
                    name={`metadata.lessons.${index}.endTime`}
                    label="End"
                    placeholder="20:00"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2"
                    disabled={isPending}
                    aria-label={`Remove lesson ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save webinar details"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
