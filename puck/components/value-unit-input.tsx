import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ValueUnitInputProps {
  value: number;
  onValueChange: (val: number) => void;
  unit: string;
  onUnitChange: (val: string) => void;
  units?: string[];
  step?: number | string;
}

export function ValueUnitInput({
  value,
  onValueChange,
  unit,
  onUnitChange,
  units = ["px", "rem", "em", "%", "vw", "vh"], // Defaults sensati
  step,
}: ValueUnitInputProps) {
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step={step}
        className="h-8 text-sm flex-1 bg-background"
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
      />
      <Select value={unit} onValueChange={onUnitChange}>
        <SelectTrigger className="h-8 text-sm w-17.5 px-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {units.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
