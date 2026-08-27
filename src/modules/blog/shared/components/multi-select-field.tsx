import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { ContentStatus } from "@/generated/prisma";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";

import { MultiSelectV2 } from "@/shared/components/multi-select-v2";
import { Skeleton } from "@/shared/ui/skeleton";

interface MultiSelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  disabled: boolean;
  label: string;
  showLabel?: boolean;
  options: {
    id: string;
    title: string;
    status: ContentStatus;
  }[];
  isLoading?: boolean;
  onSelect?: () => void;
}

export const MultiSelectField = <T extends FieldValues>({
  control,
  name,
  disabled,
  label,
  showLabel = true,
  options,
  isLoading = false,
  onSelect,
}: MultiSelectFieldProps<T>) => {
  const id = `form-rhf-multi-select-${String(name)}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        // Spostiamo la funzione all'interno del render per accedere a 'field'
        const onSelectOption = ({
          id: selectedId,
          sort,
        }: {
          id: string;
          sort: number;
        }) => {
          const currentValues: { id: string; sort: number }[] = Array.isArray(
            field.value,
          )
            ? field.value
            : [];

          const isAlreadySelected = currentValues.some(
            (v) => v.id === selectedId,
          );

          let newOptions;
          if (isAlreadySelected) {
            newOptions = currentValues.filter((v) => v.id !== selectedId);
          } else {
            newOptions = [...currentValues, { id: selectedId, sort }];
          }

          field.onChange(newOptions);

          if (onSelect) {
            onSelect();
          }
        };

        return (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex flex-col gap-y-2">
              {showLabel && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
              {isLoading && <Skeleton className="h-10 w-full" />}
              {!isLoading && (
                <MultiSelectV2
                  label={label}
                  isSubmitting={disabled}
                  values={field.value || []}
                  options={options.map((c) => ({
                    id: c.id,
                    label: c.title,
                    status: c.status,
                  }))}
                  onSelectValue={onSelectOption}
                  showValuesInButton
                />
              )}

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </div>
          </Field>
        );
      }}
    />
  );
};
