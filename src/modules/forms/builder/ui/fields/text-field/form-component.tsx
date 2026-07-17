"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/shared/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";

import type { FormElementInstance } from "../../../types";

export function TextFieldFormComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"TextField">;
}) {
  const { control } = useFormContext();

  const { name, label, helperText, placeholder, inputType, validation } =
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

            <Input
              {...field}
              id={name}
              type={inputType}
              placeholder={placeholder}
              className={
                errorMessage
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
              aria-invalid={fieldState.invalid}
            />

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
