"use client";

import { Fragment } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
  WidgetFilterChip,
} from "@/shared/dashboard/types";

interface WidgetFilterSummaryProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
  context: WidgetConfigContext;
  /** Opens the widget's config popover; omitted for non-configurable widgets. */
  onOpenConfig?: () => void;
}

/**
 * The active filters of a Dashboard widget, shown inline after its title (e.g.
 * "Form submissions · 3 forms"). The definition's `summarizeConfig` decides what
 * is worth showing; on a configurable widget the summary opens the config
 * popover, tying "what is filtered" to the control that changes it.
 */
export const WidgetFilterSummary = ({
  definition,
  instance,
  context,
  onOpenConfig,
}: WidgetFilterSummaryProps) => {
  const chips = definition.summarizeConfig?.(instance.config, context) ?? [];

  if (chips.length === 0) return null;

  const label = (chip: WidgetFilterChip) =>
    onOpenConfig ? (
      <button
        type="button"
        onClick={onOpenConfig}
        aria-label={`Show filter: ${chip.label}`}
        className="truncate underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {chip.label}
      </button>
    ) : (
      <span className="truncate">{chip.label}</span>
    );

  return (
    <TooltipProvider delayDuration={200}>
      <span className="flex min-w-0 items-center text-xs text-muted-foreground">
        {chips.map((chip) => (
          <Fragment key={chip.key}>
            <span aria-hidden className="mx-1 text-muted-foreground/50">
              ·
            </span>
            {chip.tooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>{label(chip)}</TooltipTrigger>
                <TooltipContent>{chip.tooltip}</TooltipContent>
              </Tooltip>
            ) : (
              label(chip)
            )}
          </Fragment>
        ))}
      </span>
    </TooltipProvider>
  );
};
