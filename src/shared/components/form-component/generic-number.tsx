import { Control, FieldValues, Path } from "react-hook-form";
import * as LabelPrimitive from "@radix-ui/react-label";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";

interface GenericNumberProps<
  T extends FieldValues,
> extends React.InputHTMLAttributes<HTMLInputElement> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  labelProps?: React.ComponentProps<typeof LabelPrimitive.Root>;
}

export const GenericNumber = <T extends FieldValues>({
  control,
  name,
  label,
  description,
  onBlur,
  onChange,
  containerProps,
  labelProps,
  ...inputProps
}: GenericNumberProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            `flex-1 flex flex-col space-y-2`,
            containerProps?.className && containerProps.className,
          )}
        >
          <FormLabel {...labelProps}>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              {...inputProps}
              type="number"
              value={field.value ?? ""}
              className={cn(
                `disabled:cursor-not-allowed`,
                inputProps.className && inputProps.className,
              )}
              onBlur={(e) => {
                field.onBlur(); // Mantiene la gestione di react-hook-form
                onBlur?.(e); // Chiama anche il tuo onBlur personalizzato se presente
              }}
              onChange={(e) => {
                field.onChange(
                  e.target.value === "" || Number(e.target.value) === 0
                    ? undefined
                    : parseInt(e.target.value, 10),
                ); // Mantiene la gestione di react-hook-form
                onChange?.(e); // Chiama anche il tuo onChange personalizzato se presente
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
