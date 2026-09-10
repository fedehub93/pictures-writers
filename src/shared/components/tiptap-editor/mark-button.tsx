"use client";

import "client-only";

import { LucideIcon } from "lucide-react";

import { Toggle } from "@/shared/ui/toggle";

interface MarkButtonProps {
  onClick: () => void;
  isActive: boolean;
  Icon: LucideIcon;
  label: string;
}

export const MarkButton = ({ onClick, isActive, Icon, label }: MarkButtonProps) => {
  return (
    <Toggle
      type="button"
      variant="outline"
      pressed={isActive}
      onClick={onClick}
      aria-label={label}
      size="sm"
      className="bg-background"
    >
      <Icon className="size-4" />
    </Toggle>
  );
};
