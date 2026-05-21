import React from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import { CalendarIcon } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface GenericCalendarProps<
  T extends FieldValues,
> extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  onlyFutureDates?: boolean;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const GenericCalendar = <T extends FieldValues>({
  control,
  name,
  label,
  onlyFutureDates = true,
  onBlur,
  onChange,
  containerProps,
  ...buttonProps
}: GenericCalendarProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex-1 flex flex-col">
          <FormLabel className="block">{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  {...field}
                  {...buttonProps}
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {field.value ? (
                    formatDate({ date: field.value })
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto size-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) =>
                  onlyFutureDates
                    ? date < new Date() || date < new Date("1900-01-01")
                    : false
                }
                autoFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
