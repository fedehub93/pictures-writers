import { Control, FieldValues, Path } from "react-hook-form";

import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductAcquisitionMode } from "@/generated/prisma";
import { cn } from "@/lib/utils";

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
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value}
            onValueChange={(val) => {
              field.onChange(val);
            }}
          >
            <SelectTrigger className="w-full capitalize">
              <SelectValue
                placeholder="Editor"
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
