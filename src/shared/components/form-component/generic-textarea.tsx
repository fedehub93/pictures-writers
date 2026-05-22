import { Control, FieldValues, Path } from "react-hook-form";
import * as LabelPrimitive from "@radix-ui/react-label";

import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Textarea } from "@/shared/ui/textarea";

import { cn } from "@/shared/lib/utils";

interface GenericTextareaProps<T extends FieldValues>
  extends React.ComponentProps<"textarea"> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  labelProps?: React.ComponentProps<typeof LabelPrimitive.Root>;
}

export const GenericTextarea = <T extends FieldValues>({
  control,
  name,
  label,
  onBlur,
  onChange,
  containerProps,
  labelProps,
  ...textareaProps
}: GenericTextareaProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            `flex-1 flex flex-col space-y-2`,
            containerProps?.className && containerProps.className
          )}
        >
          <FormLabel {...labelProps}>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              {...textareaProps}
              className={cn(textareaProps.className && textareaProps.className)}
              onBlur={(e) => {
                field.onBlur(); // Mantiene la gestione di react-hook-form
                onBlur?.(e); // Chiama anche il tuo onBlur personalizzato se presente
              }}
              onChange={(e) => {
                field.onChange(e); // Mantiene la gestione di react-hook-form
                onChange?.(e); // Chiama anche il tuo onChange personalizzato se presente
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
