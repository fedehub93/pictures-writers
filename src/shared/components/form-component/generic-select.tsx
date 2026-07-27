import React from "react";
import { Control, FieldValues, Path } from "react-hook-form";

import { FormField, FormItem, FormLabel } from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { cn } from "@/shared/lib/utils";

interface GenericSelectProps<
  T extends FieldValues,
> extends React.InputHTMLAttributes<HTMLInputElement> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  options: string[];
}

export const GenericSelect = <T extends FieldValues>({
  control,
  name,
  label,
  onBlur,
  onChange,
  containerProps,
  options,
  ...inputProps
}: GenericSelectProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-col space-y-2",
            containerProps?.className ? containerProps.className : "",
          )}
        >
          <FormLabel htmlFor={`rhf_select_${field.name}`}>{label}</FormLabel>
          <Select
            {...field}
            value={field.value}
            onValueChange={(val) => {
              field.onChange(val);
            }}
          >
            <SelectTrigger
              id={`rhf_select_${field.name}`}
              className="w-full capitalize mb-0"
            >
              <SelectValue
                placeholder={inputProps.placeholder}
                className={cn(
                  inputProps?.className ? inputProps.className : "",
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((a) => (
                <SelectItem
                  key={a}
                  value={a}
                  className={cn(
                    "capitalize",
                    containerProps?.className ? containerProps.className : "",
                  )}
                >
                  {a.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};
