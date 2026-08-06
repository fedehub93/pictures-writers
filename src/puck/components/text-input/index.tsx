import { Input } from "@/shared/ui/input";

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
      className="h-8 px-2 text-xs!"
      autoComplete="off"
    />
  );
};
