import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";

export type SwitchInputProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/**
 * A boolean editor control with a readable English label.
 *
 * The segmented control is reserved for choices between several values; a
 * single on/off setting reads better as a switch and does not clip its label in
 * the narrow properties panel.
 */
export function SwitchInput({
  name,
  label,
  checked,
  onChange,
}: SwitchInputProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label
        htmlFor={name}
        className="text-xs font-normal text-muted-foreground"
      >
        {label}
      </Label>
      <Switch
        id={name}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );
}
