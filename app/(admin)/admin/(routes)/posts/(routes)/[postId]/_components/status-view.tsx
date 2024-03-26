import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface StatusViewProps {
  disabled: boolean;
  postId: string;
  isPublished: boolean;
  lastSavedAt: Date;
}

export const StatusView = ({
  disabled,
  postId,
  isPublished,
  lastSavedAt,
}: StatusViewProps) => {
  const lastSavedAtLabel = `Last saved ${formatDistanceToNow(lastSavedAt, {
    addSuffix: true,
  })}`;

  return (
    <div className="bg-slate-100 dark:bg-slate-900 rounded-md p-4 transition flex flex-col gap-y-4">
      <div className="text-sm font-medium uppercase">
        Status
      </div>
      <Separator />
      <div className="flex w-full items-center justify-between">
        <p className="text-sm text-muted-foreground">Current</p>
        <Badge
          className={cn("bg-emerald-600", !isPublished && "bg-slate-500")}
        >
          Draft
        </Badge>
      </div>
      <Button className="w-full bg-emerald-600">Publish</Button>
      <p className="text-xs text-muted-foreground">{lastSavedAtLabel}</p>
    </div>
  );
};
