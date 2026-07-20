"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/shared/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";

import type { FormElementInstance } from "../../../types/core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export function SelectFieldFormComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"SelectField">;
}) {
  const { control } = useFormContext();

  const { name, label, helperText, placeholder, options, validation } =
    elementInstance.properties;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;

        return (
          <Field
            data-invalid={fieldState.invalid}
            className="flex flex-col gap-2 w-full"
          >
            <FieldLabel
              htmlFor={name}
              className={errorMessage ? "text-destructive" : ""}
            >
              {label}{" "}
              {validation.required && (
                <span className="text-destructive">*</span>
              )}
            </FieldLabel>

            <Select
              name={name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id={`form-rhf-${name}`}
                aria-invalid={fieldState.invalid}
                className="w-full"
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {helperText && !errorMessage && (
              <FieldDescription className="text-sm text-muted-foreground">
                {helperText}
              </FieldDescription>
            )}

            {errorMessage && (
              <FieldError className="text-sm text-destructive font-medium">
                {errorMessage}
              </FieldError>
            )}
          </Field>
        );
      }}
    />
  );
}
