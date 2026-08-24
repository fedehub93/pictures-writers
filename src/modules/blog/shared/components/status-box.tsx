"use client";

import { formatDistanceToNow } from "date-fns";

import { ContentStatus } from "@/generated/prisma";

import { cn } from "@/shared/lib/utils";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { Card, CardContent } from "@/shared/ui/card";

interface StatusBoxProps {
  status: ContentStatus;
  lastSavedAt: Date;
  disabled: boolean;
  canPublish: boolean;
  onToggleStatus: () => void;
}

export const StatusBox = ({
  status,
  lastSavedAt,
  disabled,
  canPublish,
  onToggleStatus,
}: StatusBoxProps) => {
  const lastSavedAtLabel = `Last saved ${formatDistanceToNow(lastSavedAt, {
    addSuffix: true,
  })}`;

  return (
    <Card className="rounded-xl bg-accent">
      <CardContent className="p-4 flex flex-col gap-y-4">
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-foreground">Current</p>
          <Badge
            className={cn(
              status === ContentStatus.DRAFT && "bg-slate-700",
              status === ContentStatus.CHANGED && "bg-sky-700",
              status === ContentStatus.PUBLISHED && "bg-emerald-700",
            )}
          >
            {status === ContentStatus.PUBLISHED
              ? "Published"
              : status === ContentStatus.CHANGED
                ? "Changed"
                : "Draft"}
          </Badge>
        </div>
        <Button
          disabled={
            disabled || (status !== ContentStatus.PUBLISHED && !canPublish)
          }
          type="button"
          role="button"
          variant="outline"
          className="w-full"
          onClick={onToggleStatus}
        >
          {status === ContentStatus.PUBLISHED ? "Unpublish" : "Publish"}
        </Button>
        <p className="text-xs text-muted-foreground">{lastSavedAtLabel}</p>
      </CardContent>
    </Card>
  );
};
