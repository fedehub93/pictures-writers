"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericTextarea } from "@/shared/components/form-component/generic-textarea";

import {
  DEFAULT_SERVICE_FEATURE_ICON_NAME,
  SERVICE_FEATURE_ICON_NAMES,
} from "../../../../../lib/service-feature-icon-names";
import { productUpdateSchema, serviceMetadataSchema } from "../../../../../schemas";
import { type ServiceMetadata } from "../../../../../types";
import { useUpdateProductMetadata } from "../../../../../hooks/use-update-product-metadata";

const formSchema = productUpdateSchema.pick({ id: true, rootId: true }).extend({
  metadata: serviceMetadataSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface ProductServiceMetadataFormProps {
  id: string;
  rootId: string;
  initialData?: Omit<ServiceMetadata, "type">;
}

export const ProductServiceMetadataForm = ({
  id,
  rootId,
  initialData,
}: ProductServiceMetadataFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      id,
      rootId,
      metadata: {
        type: "SERVICE",
        serviceType: initialData?.serviceType ?? "",
        competitorPrice: initialData?.competitorPrice ?? 0,
        target: initialData?.target ?? "",
        attachamentUrl: initialData?.attachamentUrl ?? "",
        features: initialData?.features ?? [],
      },
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "metadata.features",
  });

  const { mutate: updateProduct, isPending } = useUpdateProductMetadata({
    rootId,
    successMessage: "Service details updated successfully",
    errorMessage: "Failed to update the service details",
  });

  const onSubmit = form.handleSubmit((values) => {
    updateProduct({ id, rootId, metadata: values.metadata });
  });

  return (
    <Card className="md:p-6 shadow-sm border rounded-xl">
      <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
        <CardTitle className="text-xl font-normal text-foreground">
          Service details
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-y-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <GenericInput
                control={form.control}
                name="metadata.serviceType"
                label="Service type"
                disabled={isPending}
              />
              <GenericInput
                control={form.control}
                name="metadata.competitorPrice"
                label="Competitor price"
                type="number"
                disabled={isPending}
              />
            </div>

            <GenericTextarea
              control={form.control}
              name="metadata.target"
              label="Target"
              disabled={isPending}
            />

            <GenericInput
              control={form.control}
              name="metadata.attachamentUrl"
              label="Attachment URL"
              placeholder="https://..."
              disabled={isPending}
            />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Features</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    append({
                      title: "",
                      Icon: DEFAULT_SERVICE_FEATURE_ICON_NAME,
                      description: "",
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-1">Add feature</span>
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No features yet.
                </p>
              )}

              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-md border p-4"
                >
                  <div className="flex items-start gap-2">
                    <GenericInput
                      control={form.control}
                      name={`metadata.features.${index}.title`}
                      label="Title"
                      disabled={isPending}
                      containerProps={{ className: "flex-1" }}
                    />
                    <FormField
                      control={form.control}
                      name={`metadata.features.${index}.Icon`}
                      render={({ field }) => (
                        <FormItem className="flex flex-1 flex-col space-y-2">
                          <FormLabel htmlFor={`feature-icon-${index}`}>
                            Icon
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger
                                id={`feature-icon-${index}`}
                                className="w-full"
                              >
                                <SelectValue placeholder="Select an icon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SERVICE_FEATURE_ICON_NAMES.map((icon) => (
                                <SelectItem key={icon} value={icon}>
                                  {icon}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      disabled={isPending}
                      aria-label={`Remove feature ${index + 1}`}
                      onClick={() => remove(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <GenericTextarea
                    control={form.control}
                    name={`metadata.features.${index}.description`}
                    label="Description"
                    disabled={isPending}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save service details"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
