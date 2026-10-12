import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

import type {
  DashboardWidgetInstance,
  WidgetDefinition,
} from "../../types";

interface WidgetCardProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
}

/**
 * The chrome shared by every Dashboard widget: the definition's title and icon
 * in the header, and the widget's own component in the body.
 */
export const WidgetCard = ({ definition, instance }: WidgetCardProps) => {
  const Icon = definition.icon;
  const Widget = definition.component;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{definition.title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <Widget instance={instance} />
      </CardContent>
    </Card>
  );
};
