"use client";

import * as z from "zod";

import Image from "next/image";
import { Control, useController } from "react-hook-form";

import { CalendarIcon } from "lucide-react";

import { User } from "@prisma/client";
import { cn } from "@/lib/utils";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { productFormSchema } from "./product-form";
import { formatDate } from "@/lib/format";

interface ProductWebinarFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
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
          {" "}
          Metadata
        </div>
        <CardTitle className="text-base">Webinar Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-x-4 items-center w-full">
          <FormField
            control={control}
            name="metadata.date"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel className="block">Lesson date</FormLabel>
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="metadata.time"
            render={({ field }) => (
              <FormItem className="flex flex-col w-1/4">
                <FormLabel className="block">Lesson Time</FormLabel>
                <Input {...field} disabled={isSubmitting} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-x-4 items-center">
          <FormField
            control={control}
            name="metadata.seats"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel className="block">Seats</FormLabel>
                <Input {...field} disabled={isSubmitting} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="metadata.duration"
            render={({ field }) => {
              return (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel className="block">Duration</FormLabel>
                  <Input {...field} disabled={isSubmitting} />
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={control}
            name="metadata.platform"
            render={({ field }) => {
              return (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel className="block">Platform</FormLabel>
                  <Input {...field} disabled={isSubmitting} />
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
