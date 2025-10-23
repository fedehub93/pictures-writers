import React from "react";
import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

import { cn } from "@/lib/utils";

interface GenericMoneyInputProps<T extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const GenericMoneyInput = <T extends FieldValues>({
  control,
  name,
  label,
  onBlur,
  onChange,
  containerProps,
  ...inputProps
}: GenericMoneyInputProps<T>) => {
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
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>€</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                {...field}
                {...inputProps}
                className={cn(
                  `disabled:cursor-not-allowed`,
                  inputProps.className && inputProps.className
                )}
                onBlur={(e) => {
                  field.onBlur();
                  onBlur?.(e);
                }}
                onChange={(e) => {
                  field.onChange(e);
                  onChange?.(e);
                }}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>EUR</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
