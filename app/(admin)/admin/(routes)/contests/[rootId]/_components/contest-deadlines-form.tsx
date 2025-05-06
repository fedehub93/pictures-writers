"use client";

import { useState } from "react";
import * as z from "zod";
import { Control, useFieldArray } from "react-hook-form";
import { Contest, Media } from "@prisma/client";
import { CalendarIcon, Pencil, X } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { GenericInput } from "@/components/form-component/generic-input";
import { contestFormSchema } from "./contest-form";

interface ContestDeadlinesFormProps {
  control: Control<z.infer<typeof contestFormSchema>>;
  initialData: Contest & {
    imageCover: Media | null;
  };
  isSubmitting: boolean;
}

export const ContestDeadlinesForm = ({
  control,
  initialData,
  isSubmitting,
}: ContestDeadlinesFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);

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
        <Button
          disabled={isSubmitting}
          onClick={toggleEdit}
          type="button"
          variant="secondary"
        >
          {isEditing && <>Cancel</>}
          {!isEditing && (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!isEditing && fields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {fields.map((field, index) => (
              <Badge key={index}>
                {field.name} - {formatDate({ date: field.date, month: "long" })}
              </Badge>
            ))}
          </div>
        )}
        {!isEditing && fields.length === 0 && (
          <div className="flex flex-wrap gap-2">No deadlines found!</div>
        )}
        {isEditing && (
          <div className="space-y-8">
            {fields.map((field, index) => (
              <div key={index} className="flex gap-x-4">
                <div className="flex flex-wrap w-full gap-4">
                  <GenericInput
                    control={control}
                    name={`deadlines.${index}.name`}
                    label="Name"
                    placeholder="Early Bird Deadline"
                    disabled={isSubmitting}
                    className="min-w-40"
                  />
                  <FormField
                    control={control}
                    name={`deadlines.${index}.date`}
                    render={({ field }) => {
                      return (
                        <FormItem className="flex flex-col">
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
                  <Separator />
                </div>

                <div className="text-right">
                  <Button
                    size="icon"
                    variant="destructive"
                    type="button"
                    className="size-4"
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
        )}
      </CardContent>
    </Card>
  );
};
