import { Sparkles } from "lucide-react";
import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
  UseFormGetValues,
  UseFormSetValue,
} from "react-hook-form";

import { cn } from "@/shared/lib/utils";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { generateSlug } from "@/shared/lib/slug";

interface SlugFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  disabled?: boolean;
  placeholder?: string;
  sourceField: Path<T>;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  onGenerate?: () => void;
}

export function SlugField<T extends FieldValues>({
  control,
  name,
  disabled,
  placeholder,
  sourceField,
  getValues,
  setValue,
  onGenerate,
}: SlugFieldProps<T>) {
  const onSlugCreate = () => {
    const sourceValue = getValues(sourceField);

    if (typeof sourceValue === "string" && sourceValue.trim() !== "") {
      const generatedSlug = generateSlug(sourceValue);

      setValue(name, generatedSlug as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (onGenerate) {
        onGenerate();
      }
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`form-rhf-input-${name}`}>Slug</FieldLabel>
          <div className="flex gap-2 items-center">
            <Input
              {...field}
              className={cn(
                " aria-invalid:ring-destructive aria-invalid:focus-visible:ring-destructive",
              )}
              id={`form-rhf-input-${name}`}
              aria-invalid={fieldState.invalid}
              aria-disabled={disabled}
              disabled={disabled}
              placeholder={placeholder ?? ""}
              autoComplete="off"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={onSlugCreate}
              title={`Genera slug da ${sourceField}`}
            >
              <Sparkles className="size-4" />
            </Button>
          </div>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
