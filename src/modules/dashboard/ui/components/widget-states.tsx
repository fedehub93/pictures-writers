import { AlertCircleIcon, Loader2Icon } from "lucide-react";

import { Card, CardContent } from "@/shared/ui/card";

export const WidgetLoading = () => {
  return (
    <Card className="flex h-full min-h-32 items-center justify-center">
      <CardContent className="flex items-center justify-center py-6">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
};

export const WidgetError = () => {
  return (
    <Card className="flex h-full min-h-32 items-center justify-center">
      <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
        <AlertCircleIcon className="size-5 text-red-500" />
        <p className="text-sm text-muted-foreground">
          Impossibile caricare il widget.
        </p>
      </CardContent>
    </Card>
  );
};
