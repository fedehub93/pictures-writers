import { Suspense } from "react";
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
} from "../../types";

import { ConfigPopover } from "./config-popover";
import { WidgetError, WidgetLoading } from "./widget-states";

interface WidgetCardProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
  /** When true the card exposes its edit controls and locks the body. */
  editing?: boolean;
  /** Attaches the drag handle owned by the surrounding sortable. */
  dragHandleRef?: (element: Element | null) => void;
  /** Hides this instance. Only used while editing. */
  onHide?: () => void;
  /** Context a configurable widget's schema resolves against. */
  configContext?: WidgetConfigContext;
  /** Receives this instance's new config. Only used while editing. */
  onConfigure?: (config: Record<string, unknown>) => void;
}

/**
 * The chrome shared by every Dashboard widget: the definition's title and icon
 * in the header, and the widget's own component in the body, wrapped in its own
 * Suspense and error boundary so a widget's loading or failure never takes the
 * card's chrome (or the dashboard) down with it. In edit mode the body's
 * interactions are disabled and the card exposes a drag handle, a control to
 * hide it, and — for a configurable definition — a gear opening its config
 * popover.
 */
export const WidgetCard = ({
  definition,
  instance,
  editing = false,
  dragHandleRef,
  onHide,
  configContext,
  onConfigure,
}: WidgetCardProps) => {
  const Icon = definition.icon;
  const Widget = definition.component;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{definition.title}</CardTitle>
        {editing ? (
          <div className="flex items-center gap-1">
            {definition.configSchema && configContext && onConfigure ? (
              <ConfigPopover
                definition={definition}
                instance={instance}
                context={configContext}
                onChange={onConfigure}
              />
            ) : null}
            {onHide ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Nascondi ${definition.title}`}
                onClick={onHide}
              >
                <X />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="cursor-grab touch-none"
              aria-label={`Trascina ${definition.title}`}
              ref={dragHandleRef}
            >
              <GripVertical />
            </Button>
          </div>
        ) : (
          <Icon className="size-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col" inert={editing || undefined}>
        <Suspense fallback={<WidgetLoading />}>
          <ErrorBoundary fallback={<WidgetError />}>
            <Widget instance={instance} />
          </ErrorBoundary>
        </Suspense>
      </CardContent>
    </Card>
  );
};
