import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

interface GenericSwitchProps<T extends FieldValues>
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  control: Control<T>;
  name: Path<T>;
  label: string;
}

export const GenericSwitch = <T extends FieldValues>({
  control,
  name,
  label,
  ...buttonProps
}: GenericSwitchProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between gap-x-4">
          <FormLabel className="text-base mb-0">{label}</FormLabel>
          <FormControl>
            <Switch
              {...field}
              {...buttonProps}
              checked={field.value}
              onCheckedChange={field.onChange}
              className="mb-0"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
