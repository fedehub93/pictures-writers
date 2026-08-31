"use client";

import type { Editor } from "@tiptap/core";
import { ListTree } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/ui/card";

import { usePostOutline } from "@/modules/blog/posts/hooks/use-post-outline";

export interface PostOutlineProps {
  editor: Editor | null;
}

export const PostOutline = ({ editor }: PostOutlineProps) => {
  const { headings, activeHeadingId, navigateToHeading } =
    usePostOutline(editor);

  return (
    <Card className="flex flex-col max-h-full min-h-0">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <ListTree className="size-4 text-muted-foreground" aria-hidden="true" />
        <CardTitle className="text-base font-semibold">Outline</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-4 pt-0">
        {headings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No headings yet.</p>
        ) : (
          <ScrollArea aria-label="Post outline" className="h-full pr-4">
            <ol className="space-y-1">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <button
                    type="button"
                    aria-current={
                      activeHeadingId === heading.id ? "location" : undefined
                    }
                    onClick={() => navigateToHeading(heading)}
                    className={cn(
                      "block w-full min-w-0 truncate rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      activeHeadingId === heading.id &&
                        "bg-accent font-medium text-accent-foreground",
                      heading.level === 3 && "pl-5",
                      heading.level === 4 && "pl-8",
                    )}
                  >
                    {heading.label}
                  </button>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};