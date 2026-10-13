"use client";

import { Suspense, useState, useSyncExternalStore } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { GripVertical, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "@/shared/dashboard/types";
import { WidgetError, WidgetLoading } from "@/shared/dashboard/ui/widget-states";

import { resolveWidgetSize } from "../../lib/widget-size";
import { resolveWidgetTitle } from "../../lib/widget-title";

import { ConfigPopover } from "./config-popover";
import { WidgetFilterChips } from "./widget-filter-chips";
import { WidgetSizeMenu } from "./widget-size-menu";
import { WidgetTitle } from "./widget-title";

interface WidgetCardProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
  /** Attaches the drag handle owned by the surrounding sortable. */
  dragHandleRef?: (element: Element | null) => void;
  /** Context a configurable widget's schema resolves against. */
  configContext?: WidgetConfigContext;
  /** Receives a patch for this instance: rename, resize or reconfigure it. */
  onUpdate?: (patch: Partial<DashboardWidgetInstance>) => void;
  /** Removes this instance from the dashboard. */
  onRemove?: () => void;
}

const subscribeToNothing = () => () => {};

const EMPTY_CONFIG_CONTEXT: WidgetConfigContext = { metrics: [], forms: [] };

/**
 * Whether the widget body may render yet. The widgets' data queries run through
 * the browser tRPC client, but the dashboard only prefetches its layout and
 * metrics — not each widget's data — so rendering a widget during SSR would
 * fire that client over HTTP from the server, without the request cookies, and
 * every query would fail as unauthorized. The body therefore waits for the
 * browser, showing the shared loading state on the server.
 */
const useIsClient = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

/**
 * The chrome shared by every Dashboard widget: the widget's title (renamable in
 * place), the definition's one-line description, and the instance's active
 * filter chips, with the widget's own component in the body — wrapped in its own
 * Suspense and error boundary so a widget's loading or failure never takes the
 * card's chrome (or the dashboard) down with it.
 *
 * The dashboard is always arrangeable, so the arrange controls (size, config,
 * remove, drag) are always mounted. They are visually revealed on hover or focus
 * on pointer devices, and kept visible on small (touch) screens so they remain
 * reachable without a hover state.
 */
export const WidgetCard = ({
  definition,
  instance,
  dragHandleRef,
  configContext,
  onUpdate,
  onRemove,
}: WidgetCardProps) => {
  const Icon = definition.icon;
  const Widget = definition.component;
  const Loading = definition.loadingFallback ?? WidgetLoading;
  const isClient = useIsClient();
  const [configOpen, setConfigOpen] = useState(false);

  const title = resolveWidgetTitle(
    definition,
    instance,
    configContext ?? EMPTY_CONFIG_CONTEXT,
  );

  return (
    <Card className="group/card flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {onUpdate ? (
            <div className="flex min-w-0 items-center gap-1">
              <WidgetTitle
                title={title}
                onRename={(next) => onUpdate({ title: next })}
              />
              {configContext ? (
                <WidgetFilterChips
                  definition={definition}
                  instance={instance}
                  context={configContext}
                  onOpenConfig={
                    definition.configSchema
                      ? () => setConfigOpen(true)
                      : undefined
                  }
                />
              ) : null}
            </div>
          ) : (
            <CardTitle className="truncate text-sm font-medium">
              {title}
            </CardTitle>
          )}
          {definition.description ? (
            <p className="truncate text-xs text-muted-foreground">
              {definition.description}
            </p>
          ) : null}
        </div>
        {onUpdate ? (
          <div className="relative flex h-7 shrink-0 items-center justify-end">
            <Icon className="hidden size-4 text-muted-foreground md:absolute md:right-0 md:block md:transition-opacity md:group-focus-within/card:opacity-0 md:group-hover/card:opacity-0" />
            <div className="flex items-center gap-1 bg-card opacity-100 md:opacity-0 md:transition-opacity md:group-focus-within/card:opacity-100 md:group-hover/card:opacity-100">
              <WidgetSizeMenu
                size={resolveWidgetSize(instance, definition)}
                onSelect={(size) => onUpdate({ size })}
              />
              {definition.configSchema && configContext ? (
                <ConfigPopover
                  definition={definition}
                  instance={instance}
                  context={configContext}
                  label={title}
                  open={configOpen}
                  onOpenChange={setConfigOpen}
                  onChange={(config) => onUpdate({ config })}
                />
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${title}`}
                onClick={onRemove}
              >
                <X />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="cursor-grab touch-none"
                aria-label={`Drag ${title}`}
                ref={dragHandleRef}
              >
                <GripVertical />
              </Button>
            </div>
          </div>
        ) : (
          <Icon className="size-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isClient ? (
          <Suspense fallback={<Loading />}>
            <ErrorBoundary fallback={<WidgetError />}>
              <Widget instance={instance} />
            </ErrorBoundary>
          </Suspense>
        ) : (
          <Loading />
        )}
      </CardContent>
    </Card>
  );
};
