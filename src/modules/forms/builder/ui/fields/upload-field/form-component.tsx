"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";

import type { FormElementInstance } from "../../../types/core";
import { FileUploadButton } from "@/shared/components/file-upload-button";

export function UploadFieldFormComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"UploadField">;
}) {
  const { control } = useFormContext();

  const { name, label, helperText, files, validation } =
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

            <FileUploadButton
              endpoint="submissionAttachments"
              size="small"
              value={field.value as any[]}
              onChange={(files: any[]) => field.onChange(files)}
              disabled={false}
            />

            {helperText && !errorMessage && (
              <FieldDescription className="text-xs text-muted-foreground">
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
