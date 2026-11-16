import type { LucideProps } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { ComponentType } from "react";

import { PANEL_CONTROL } from "@/puck/components/panel-control";

interface SegmentedControlProps<T extends string> {
  name: string;
  value: T;
  onChange: (val: T) => void;
  items: { value: T; icon?: ComponentType<LucideProps>; title: string }[];
}

export function SegmentedControl<T extends string>({
  name,
  value,
  onChange,
  items,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup
      id={name}
      type="single"
      value={value}
      onValueChange={(val) => {
        if (val) onChange(val as T);
      }}
      className={cn(
        PANEL_CONTROL.height,
        "flex items-center justify-start bg-background rounded-md w-full min-w-0 gap-0 border border-input",
      )}
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          title={item.title}
          aria-label={item.title}
          className={cn(
            "flex-1 min-w-0 h-full rounded-sm transition-all px-1.5 py-0 text-xs",
            value === item.value &&
              "data-[state=on]:bg-accent data-[state=on]:border-x text-foreground",
          )}
        >
          {item.icon && (
            <item.icon className="size-4 shrink-0" strokeWidth={2.5} />
          )}
          {!item.icon && (
            <span className="min-w-0 truncate">{item.title}</span>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
