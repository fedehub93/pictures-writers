import { Control, Controller, FieldValues, Path } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";

import { Switch } from "@/shared/ui/switch";

interface SwitchFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  description?: string;
}

export const SwitchField = <T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  description,
}: SwitchFieldProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          className="flex flex-col rounded-lg border p-4 gap-3"
        >
          <div className="flex flex-row items-center justify-between w-full gap-4">
            <div className="space-y-0.5">
              <FieldLabel htmlFor="form-rhf-input-title">{label}</FieldLabel>
              <FieldDescription>{description}</FieldDescription>
            </div>

            <div className="shrink-0">
              <Switch
                id="form-rhf-switch-twoFactor"
                name={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-invalid={fieldState.invalid}
                aria-disabled={disabled}
                disabled={disabled}
              />
            </div>
          </div>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};
