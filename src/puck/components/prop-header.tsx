import { X } from "lucide-react";

import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";

interface ControlHeaderProps {
  label: string;
  name: string;
  isModified: boolean;
  onReset: () => void;
}

export function PropHeader({
  label,
  name,
  isModified,
  onReset,
}: ControlHeaderProps) {
  return (
    // L'altezza fissa (h-5) evita che il layout "salti" quando appare/scompare la X
    <div className="flex items-center justify-between h-5">
      <Label
        htmlFor={name}
        className={`text-xs transition-colors ${
          isModified ? "text-primary font-medium" : "text-muted-foreground"
        }`}
      >
        {label}
      </Label>
      {isModified && (
        <Button
          onClick={onReset}
          className="size-4 p-0 text-muted-foreground hover:text-destructive transition-colors hover:bg-transparent"
          variant="ghost"
          title="Reset to default"
          type="button"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
