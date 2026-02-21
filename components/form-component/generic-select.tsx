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

interface GenericSelectProps<T extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
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
        <FormItem className="flex flex-col space-y-2">
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value}
            onValueChange={(val) => {
              field.onChange(val);
            }}
          >
            <SelectTrigger className="w-full capitalize">
              <SelectValue placeholder="Editor" />
            </SelectTrigger>
            <SelectContent>
              {options.map((a) => (
                <SelectItem key={a} value={a} className="capitalize">
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
