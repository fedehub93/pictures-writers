import { X } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ControlHeaderProps {
  label: string;
  isModified: boolean;
  onReset: () => void;
}

export function PropHeader({ label, isModified, onReset }: ControlHeaderProps) {
  return (
    // L'altezza fissa (h-5) evita che il layout "salti" quando appare/scompare la X
    <div className="flex items-center justify-between mb-1.5 h-5">
      <Label
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
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
