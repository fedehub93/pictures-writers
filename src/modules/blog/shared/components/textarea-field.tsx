import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";

import { Textarea } from "@/shared/ui/textarea";

interface TextareaFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  placeholder,
}: TextareaFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="form-rhf-input-textarea">{label}</FieldLabel>
          <Textarea
            {...field}
            id="form-rhf-input-textarea"
            aria-invalid={fieldState.invalid}
            aria-disabled={disabled}
            disabled={disabled}
            placeholder={placeholder ?? ""}
            autoComplete="textarea"
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
