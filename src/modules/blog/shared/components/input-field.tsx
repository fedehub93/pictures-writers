import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";

import { Input } from "@/shared/ui/input";

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
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="form-rhf-input-title">{label}</FieldLabel>
          <Input
            {...field}
            id="form-rhf-input-title"
            aria-invalid={fieldState.invalid}
            aria-disabled={disabled}
            disabled={disabled}
            placeholder={placeholder ?? ""}
            autoComplete="off"
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};
