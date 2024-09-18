"use client";

import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SeoContentTypeApi } from "@/components/seo/types";
import { ContentStatus } from "@prisma/client";

interface StatusViewProps {
  disabled: boolean;
  contentType: SeoContentTypeApi;
  contentRootId: string;
  contentId: string;
  status: ContentStatus;
  lastSavedAt: Date;
}

export const StatusView = ({
  disabled,
  contentType,
  contentRootId,
  contentId,
  status,
  lastSavedAt,
}: StatusViewProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const lastSavedAtLabel = `Last saved ${formatDistanceToNow(lastSavedAt, {
    addSuffix: true,
  })}`;

  const onHandleClick = async () => {
    try {
      setIsLoading(true);

      if (status === ContentStatus.PUBLISHED) {
        await axios.patch(
          `/api/${contentType}/${contentRootId}/versions/${contentId}/unpublish`
        );
        toast.success("Item unpublished");
      } else {
        await axios.patch(
          `/api/${contentType}/${contentRootId}/versions/${contentId}/publish`
        );
        toast.success("Item published");
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 rounded-md p-4 transition flex flex-col gap-y-4">
      <div className="text-sm font-medium uppercase">Status</div>
      <Separator />
      <div className="flex w-full items-center justify-between">
        <p className="text-sm text-muted-foreground">Current</p>
        <Badge
          className={cn(
            status === ContentStatus.DRAFT && "bg-slate-700",
            status === ContentStatus.CHANGED && "bg-sky-700",
            status === ContentStatus.PUBLISHED && "bg-emerald-700"
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
        disabled={disabled || isLoading}
        variant="outline"
        className="w-full"
        onClick={onHandleClick}
      >
        {status === ContentStatus.PUBLISHED ? "Unpublish" : "Publish"}
      </Button>
      <p className="text-xs text-muted-foreground">{lastSavedAtLabel}</p>
    </div>
  );
};
