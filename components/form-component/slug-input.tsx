import { Control, FieldValues, Path } from "react-hook-form";
import { MouseEventHandler } from "react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";

interface SlugInputProps<T extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  buttonOnClick?: MouseEventHandler<HTMLButtonElement>;
}

export const SlugInput = <T extends FieldValues>({
  control,
  name,
  label,
  buttonOnClick,
  onBlur,
  onChange,
  ...inputProps
}: SlugInputProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col space-y-2">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex flex-row gap-x-2">
              <Input
                {...field}
                {...inputProps}
                onBlur={(e) => {
                  field.onBlur(); // Mantiene la gestione di react-hook-form
                  onBlur?.(e); // Chiama anche il tuo onBlur personalizzato se presente
                }}
                onChange={(e) => {
                  field.onChange(e); // Mantiene la gestione di react-hook-form
                  onChange?.(e); // Chiama anche il tuo onChange personalizzato se presente
                }}
              />
              <Button type="button" variant="secondary" onClick={buttonOnClick}>
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
