import React from "react";
import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface GenericRadioGroupProps<T extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: string[];
  disabled?: boolean;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const GenericRadioGroup = <T extends FieldValues>({
  control,
  name,
  label,
  options,
  disabled,
  containerProps,
}: GenericRadioGroupProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem {...containerProps}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-wrap space-x-4"
              disabled={disabled}
            >
              {options.map((o) => (
                <FormItem key={o} className="flex items-center gap-3 py-2">
                  <FormControl>
                    <RadioGroupItem
                      id={o}
                      value={o}
                      className="mb-0"
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormLabel htmlFor={o} className="capitalize">
                    {o.toLowerCase()}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
};
