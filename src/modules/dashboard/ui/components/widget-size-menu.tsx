"use client";

import { Maximize2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { WIDGET_SIZE_LABEL } from "../../lib/widget-size";
import { WIDGET_SIZES, type WidgetSize } from "@/shared/dashboard/types";

interface WidgetSizeMenuProps {
  /** The instance's current effective size. */
  size: WidgetSize;
  onSelect: (size: WidgetSize) => void;
}

/**
 * The size control every Dashboard widget shows while arranging: a menu that
 * resizes just that instance. Layout, not widget data, so it is separate from
 * the config gear.
 */
export const WidgetSizeMenu = ({ size, onSelect }: WidgetSizeMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Widget size"
        >
          <Maximize2 />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Size</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={size}
          onValueChange={(value) => onSelect(value as WidgetSize)}
        >
          {WIDGET_SIZES.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {WIDGET_SIZE_LABEL[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
