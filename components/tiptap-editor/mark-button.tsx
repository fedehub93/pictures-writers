import React from "react";
import { LucideIcon } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";

interface MarkButtonProps {
  onClick: () => void;
  isActive: boolean;
  Icon: LucideIcon;
}

export const MarkButton = ({ onClick, isActive, Icon }: MarkButtonProps) => {
  return (
    <Toggle
      type="button"
      variant="outline"
      pressed={isActive}
      onClick={onClick}
      aria-label="Toggle"
    >
      <Icon className="size-4" />
    </Toggle>
  );
};
