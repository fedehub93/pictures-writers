import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";

import { PANEL_CONTROL } from "@/puck/components/panel-control";

export type TextInputProps = {
  name: string;
  onChange: (val: string) => void;
  value?: string;
  placeholder?: string;
};

export const TextInput = ({
  name,
  onChange,
  value,
  placeholder,
}: TextInputProps) => {
  const displayValue = (value ?? "") as string;

  return (
    <Input
      id={name}
      value={displayValue}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(PANEL_CONTROL.box, PANEL_CONTROL.fill)}
      autoComplete="off"
    />
  );
};
