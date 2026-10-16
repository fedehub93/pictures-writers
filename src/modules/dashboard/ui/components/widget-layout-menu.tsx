"use client";

import { Maximize2, MoveDown, MoveUp } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { WidgetGridPlacement } from "@/shared/dashboard/types";

import type { ResolvedWidgetBounds } from "../../lib/grid-layout";
import {
  heightStops,
  widthStops,
  type LayoutAction,
} from "../../lib/keyboard-layout";

interface WidgetLayoutMenuProps {
  /** The widget's effective title, so the control names the instance. */
  title: string;
  /** The instance's current placement, to mark the active width/height stop. */
  placement: WidgetGridPlacement;
  /** The definition's resolved bounds, from which the stops are derived. */
  bounds: ResolvedWidgetBounds;
  /** Whether a move up or down has a neighbour to swap with. */
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Applies a chosen width/height stop, or a move up or down. */
  onAction: (action: LayoutAction) => void;
}

/**
 * The keyboard path to arranging a widget: a menu that resizes by stepping to a
 * size preset's width or height and moves the widget up or down the dashboard's
 * reading order. It replaces the old discrete size menu, keeping its labels as
 * the stops. `react-grid-layout` offers no keyboard move/resize, so this is the
 * only pointer-free way to arrange. The menu is opened with Enter or Space and
 * navigated with the arrow keys, and the move controls are disabled when there
 * is no neighbour to swap with in that direction.
 */
export const WidgetLayoutMenu = ({
  title,
  placement,
  bounds,
  canMoveUp = true,
  canMoveDown = true,
  onAction,
}: WidgetLayoutMenuProps) => {
  const widths = widthStops(bounds);
  const heights = heightStops(bounds);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Layout for ${title}`}
        >
          <Maximize2 />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Layout</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Width</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(placement.w)}
          onValueChange={(value) =>
            onAction({ type: "width", value: Number(value) })
          }
        >
          {widths.map((stop) => (
            <DropdownMenuRadioItem
              key={`width-${stop.value}`}
              value={String(stop.value)}
            >
              {stop.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Height</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(placement.h)}
          onValueChange={(value) =>
            onAction({ type: "height", value: Number(value) })
          }
        >
          {heights.map((stop) => (
            <DropdownMenuRadioItem
              key={`height-${stop.value}`}
              value={String(stop.value)}
            >
              {stop.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canMoveUp}
          onSelect={() => onAction({ type: "move", direction: -1 })}
        >
          <MoveUp />
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canMoveDown}
          onSelect={() => onAction({ type: "move", direction: 1 })}
        >
          <MoveDown />
          Move down
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
