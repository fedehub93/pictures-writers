import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { CharsCounter } from "@/shared/components/chars-counter";

interface InputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
}

export const InputField = <T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  placeholder,
}: InputFieldProps<T>) => {
  const id = `form-rhf-input-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex flex-col gap-y-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input
              {...field}
              id={id}
              aria-invalid={fieldState.invalid}
              aria-disabled={disabled}
              disabled={disabled}
              placeholder={placeholder ?? ""}
              autoComplete="off"
            />
            <CharsCounter value={field.value} />

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
        </Field>
      )}
    />
  );
};
