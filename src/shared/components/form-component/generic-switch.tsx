import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Switch } from "@/shared/ui/switch";
import { cn } from "@/shared/lib/utils";

interface GenericSwitchProps<T extends FieldValues>
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  description?: string;
}

export const GenericSwitch = <T extends FieldValues>({
  control,
  name,
  label,
  description,
  ...buttonProps
}: GenericSwitchProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row justify-between gap-x-4",
            label && "items-center"
          )}
        >
          {label && <FormLabel className="mb-0">{label}</FormLabel>}
          {description && <FormDescription className="mb-0">{description}</FormDescription>}
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
