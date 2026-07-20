"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Textarea } from "@/shared/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";

import type { FormElementInstance } from "../../../types/core";

export function TextareaFieldFormComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"TextareaField">;
}) {
  const { control } = useFormContext();

  const { name, label, helperText, placeholder, validation } =
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

            <Textarea
              {...field}
              id={name}
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
