"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";

import { Checkbox } from "@/shared/ui/checkbox";

import type { FormElementInstance } from "../../../types/core";
import { TipTapRenderer } from "../../../tiptap/tiptap-renderer";
import { cn } from "@/shared/lib/utils";

export function CheckboxFieldFormComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"CheckboxField">;
}) {
  const { control } = useFormContext();

  const { name, helperText, description, validation } =
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
            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id={`form-rhf-checkbox-${field.name}`}
                name={field.name}
                aria-invalid={fieldState.invalid}
                checked={field.value || false}
                onCheckedChange={(checked) => field.onChange(checked)}
                className="size-5 accent-primary"
                required={validation.required}
              />
              <div className="space-y-1 self-center leading-none">
                <FieldLabel
                  htmlFor={name}
                  className={cn(`text-xs`, errorMessage && "text-destructive")}
                >
                  <TipTapRenderer content={description} />
                </FieldLabel>
              </div>
            </div>

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
