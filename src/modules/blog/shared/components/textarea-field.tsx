import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";

import { Textarea } from "@/shared/ui/textarea";
import { CharsCounter } from "@/shared/components/chars-counter";

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
  const id = `form-rhf-input-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex flex-col gap-y-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Textarea
              {...field}
              id={id}
              aria-invalid={fieldState.invalid}
              aria-disabled={disabled}
              disabled={disabled}
              placeholder={placeholder ?? ""}
              autoComplete="textarea"
            />
            <CharsCounter value={field.value} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
        </Field>
      )}
    />
  );
}
