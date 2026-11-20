"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";

import type { FormElementInstance } from "../../../types/core";
import type { PublicFormAttachment } from "@/shared/lib/public-form-upload";

import { useFormUploadFormId } from "../../../runner/form-upload-context";
import { PublicFileUpload } from "@/shared/components/public-file-upload";

export function UploadFieldFormComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"UploadField">;
}) {
  const { control } = useFormContext();
  const formId = useFormUploadFormId();

  const { name, label, helperText, validation } =
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

            <PublicFileUpload
              formId={formId}
              size="small"
              value={(field.value ?? []) as PublicFormAttachment[]}
              onChange={(files: PublicFormAttachment[]) => field.onChange(files)}
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
