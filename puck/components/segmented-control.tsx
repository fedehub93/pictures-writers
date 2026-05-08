import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (val: T) => void;
  items: { value: T; icon: LucideIcon; title: string }[];
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  items,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        if (val) onChange(val as T);
      }}
      className="flex items-center justify-start bg-background p-1 rounded-md h-8 w-full gap-0 border border-input"
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          title={item.title}
          aria-label={item.title}
          className={cn(
            "flex-1 h-full rounded-sm transition-all",
            value === item.value &&
              "data-[state=on]:bg-primary-foreground shadow-sm text-foreground",
          )}
        >
          <item.icon className="h-4 w-4" strokeWidth={2.5} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
