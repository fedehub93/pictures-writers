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

interface StatusViewProps {
  disabled: boolean;
  contentType: SeoContentTypeApi;
  contentId: string;
  isPublished: boolean;
  lastSavedAt: Date;
}

export const StatusView = ({
  disabled,
  contentType,
  contentId,
  isPublished,
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

      if (isPublished) {
        await axios.patch(`/api/${contentType}/${contentId}/unpublish`);
        toast.success("Item unpublished");
      } else {
        await axios.patch(`/api/${contentType}/${contentId}/publish`);
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
        <Badge className={cn("bg-sky-700", !isPublished && "bg-slate-500")}>
          {isPublished ? "Published" : "Draft"}
        </Badge>
      </div>
      <Button
        disabled={disabled || isLoading}
        variant="outline"
        className="w-full"
        onClick={onHandleClick}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <p className="text-xs text-muted-foreground">{lastSavedAtLabel}</p>
    </div>
  );
};
