import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

import { MultiSelectSimple } from "@/components/multi-select-simple";

interface GenericMultiSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  data: {
    id: string;
    label: string;
    imageUrl?: string;
  }[];
  isLoading?: boolean;
  disabled?: boolean;
}

export const GenericMultiSelect = <T extends FieldValues>({
  control,
  name,
  label,
  data,
  isLoading = true,
  disabled = false,
}: GenericMultiSelectProps<T>) => {
  if (isLoading) {
    return (
      <FormField
        control={control}
        name={name}
        render={() => (
          <FormItem className="w-full flex flex-col">
            <FormLabel>{label}</FormLabel>
            <Skeleton className="w-full h-9" />
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full flex flex-col">
          <FormLabel>{label}</FormLabel>
          <MultiSelectSimple
            label={label}
            isSubmitting={disabled}
            values={field.value}
            options={data.map((d) => ({
              id: d.id,
              label: d.label,
            }))}
            onChange={field.onChange}
            showValuesInButton
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
