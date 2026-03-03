"use client";

import { Control, useFieldArray } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { ProductFormValues } from "@/schemas/product";
import { Textarea } from "@/components/ui/textarea";

interface ProductServiceFormProps {
  control: Control<ProductFormValues>;
  isSubmitting: boolean;
}

export const ProductServiceForm = ({
  control,
  isSubmitting,
}: ProductServiceFormProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "metadata.features",
  });
  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          {" "}
          Metadata
        </div>
        <CardTitle className="text-base">Service Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-x-4 items-center">
          <FormField
            control={control}
            name="metadata.serviceType"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel className="block">Tipo di servizio</FormLabel>
                <Input {...field} disabled={isSubmitting} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="metadata.competitorPrice"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel className="block">Prezzo del concorrente</FormLabel>
                <Input {...field} type="number" disabled={isSubmitting} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="metadata.target"
          render={({ field }) => (
            <FormItem className="flex-1 flex flex-col">
              <FormLabel className="block">Target</FormLabel>
              <Textarea {...field} disabled={isSubmitting} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="metadata.attachamentUrl"
          render={({ field }) => (
            <FormItem className="flex-1 flex flex-col">
              <FormLabel className="block">URL dell'allegato</FormLabel>
              <Input {...field} disabled={isSubmitting} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem className="flex-1 flex flex-col">
          <FormLabel className="block">Features</FormLabel>
          <div className="flex flex-col gap-2">
            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-start">
                <div className="flex-1 flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <FormField
                        control={control}
                        name={`metadata.features.${index}.title`}
                        render={({ field }) => (
                          <FormItem className="flex-1 flex flex-col">
                            <FormLabel className="sr-only">Title</FormLabel>
                            <Input
                              {...field}
                              placeholder="Titolo feature"
                              disabled={isSubmitting}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-5">
                      <FormField
                        control={control}
                        name={`metadata.features.${index}.Icon`}
                        render={({ field }) => {
                          const IconComp = (LucideIcons as any)[field.value];
                          return (
                            <FormItem className="flex-1 flex flex-col">
                              <FormLabel className="sr-only">Icon</FormLabel>
                              <div className="flex items-center gap-2">
                                <Input
                                  {...field}
                                  placeholder="Icon (es. Plus)"
                                  disabled={isSubmitting}
                                />
                                <div className="w-8 h-8 flex items-center justify-center">
                                  {IconComp ? (
                                    <IconComp className="h-5 w-5" />
                                  ) : null}
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={() => remove(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <FormField
                      control={control}
                      name={`metadata.features.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="flex-1 flex flex-col">
                          <FormLabel className="block">Descrizione</FormLabel>
                          <Textarea {...field} disabled={isSubmitting} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div>
              <Button
                type="button"
                size="sm"
                onClick={() => append({ title: "", icon: "", description: "" })}
              >
                <Plus className="h-4 w-4" />
                <span className="ml-1">Aggiungi feature</span>
              </Button>
            </div>
          </div>
        </FormItem>
      </CardContent>
    </Card>
  );
};
