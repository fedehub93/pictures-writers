"use client";

import * as z from "zod";
import { Control, useFieldArray } from "react-hook-form";
import { Contest } from "@prisma/client";
import { CalendarIcon, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

import { GenericInput } from "@/components/form-component/generic-input";

import { StagesFormSchema } from "./stages-form";

interface ContestStagesFormProps {
  control: Control<z.infer<typeof StagesFormSchema>>;
  isSubmitting: boolean;
}

export const ContestStagesForm = ({
  control,
  isSubmitting,
}: ContestStagesFormProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "stages",
  });
  const onAddStage = () => {
    append({
      id: undefined,
      date: new Date(),
      name: "",
    });
  };

  const onRemoveStage = (index: number) => {
    remove(index);
  };

  return (
    <Card>
      <CardHeader className="flex md:flex-row items-center justify-between w-full">
        <CardTitle className="text-base">
          <div>📅 Stages</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {fields
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .map((field, index) => (
              <div key={index} className="flex gap-x-4">
                <div className="flex flex-wrap w-full gap-4 border p-4 rounded-md bg-secondary">
                  <GenericInput
                    control={control}
                    name={`stages.${index}.name`}
                    label="Name"
                    placeholder="Quarter Finalist Announcement"
                    disabled={isSubmitting}
                    className="min-w-40 bg-white"
                  />
                  <FormField
                    control={control}
                    name={`stages.${index}.date`}
                    render={({ field }) => {
                      return (
                        <FormItem className="flex flex-col min-w-40">
                          <FormLabel className="block">Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isSubmitting}
                                >
                                  {field.value ? (
                                    formatDate({ date: field.value })
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <div className="text-right">
                  <Button
                    size="icon"
                    variant="destructive"
                    type="button"
                    className="size-8"
                    disabled={isSubmitting}
                    onClick={() => onRemoveStage(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onAddStage}
            variant="outline"
          >
            Add a stage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
