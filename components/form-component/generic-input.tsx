import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";

interface GenericInputProps<T extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const GenericInput = <T extends FieldValues>({
  control,
  name,
  label,
  onBlur,
  onChange,
  containerProps,
  ...inputProps
}: GenericInputProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={`flex-1 flex flex-col space-y-2 ${containerProps?.className}`}
        >
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              {...inputProps}
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
