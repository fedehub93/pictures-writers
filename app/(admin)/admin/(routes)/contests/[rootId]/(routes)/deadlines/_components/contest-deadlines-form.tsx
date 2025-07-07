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

import { DeadlinesFormSchema } from "./deadlines-form";

interface ContestDeadlinesFormProps {
  control: Control<z.infer<typeof DeadlinesFormSchema>>;
  initialData: Contest & {
    deadlines: {
      id: string;
      name: string;
      date: Date;
    }[];
  };
  isSubmitting: boolean;
}

export const ContestDeadlinesForm = ({
  control,
  initialData,
  isSubmitting,
}: ContestDeadlinesFormProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "deadlines",
  });
  const onAddDeadline = () => {
    append({
      id: undefined,
      date: new Date(),
      name: "",
    });
  };

  const onRemoveDeadline = (index: number) => {
    remove(index);
  };

  return (
    <Card>
      <CardHeader className="flex md:flex-row items-center justify-between w-full">
        <CardTitle className="text-base">
          <div>📅 Deadlines</div>
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
                    name={`deadlines.${index}.name`}
                    label="Name"
                    placeholder="Early Bird Deadline"
                    disabled={isSubmitting}
                    className="min-w-40 bg-white"
                  />
                  <FormField
                    control={control}
                    name={`deadlines.${index}.date`}
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
                    onClick={() => onRemoveDeadline(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onAddDeadline}
            variant="outline"
          >
            Add a deadline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
