"use client";

import { Fragment } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "@/shared/dashboard/types";

interface WidgetFilterChipsProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
  context: WidgetConfigContext;
  /** Opens the widget's config popover; omitted for non-configurable widgets. */
  onOpenConfig?: () => void;
}

const chipClass =
  "inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground";
const interactiveChipClass =
  "transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The active filters of a Dashboard widget, summarised as chips by the
 * definition's `summarizeConfig`. A chip row is shown only when the definition
 * summarises a real narrowing; on a configurable widget each chip opens the
 * widget's config popover, tying "what is filtered" to the control that changes
 * it.
 */
export const WidgetFilterChips = ({
  definition,
  instance,
  context,
  onOpenConfig,
}: WidgetFilterChipsProps) => {
  const chips = definition.summarizeConfig?.(instance.config, context) ?? [];

  if (chips.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center gap-1">
        {chips.map((chip) => {
          const className = cn(
            chipClass,
            onOpenConfig && interactiveChipClass,
          );

          const trigger = onOpenConfig ? (
            <button
              type="button"
              onClick={onOpenConfig}
              aria-label={`Show filter: ${chip.label}`}
              className={className}
            >
              {chip.label}
            </button>
          ) : (
            <span className={className}>{chip.label}</span>
          );

          return chip.tooltip ? (
            <Tooltip key={chip.key}>
              <TooltipTrigger asChild>{trigger}</TooltipTrigger>
              <TooltipContent>{chip.tooltip}</TooltipContent>
            </Tooltip>
          ) : (
            <Fragment key={chip.key}>{trigger}</Fragment>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
