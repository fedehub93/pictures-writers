"use client";

import type { Editor } from "@tiptap/core";
import { ListTree } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { usePostOutline } from "@/modules/blog/posts/hooks/use-post-outline";

export interface PostOutlineProps {
  editor: Editor | null;
}

export const PostOutline = ({ editor }: PostOutlineProps) => {
  const { headings, activeHeadingId, navigateToHeading } =
    usePostOutline(editor);

  return (
    <aside className="sticky top-0 flex h-full min-h-0 flex-col bg-card/50 p-4 border rounded-xl">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <ListTree className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-medium">Outline</h2>
      </div>

      {headings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No headings yet.</p>
      ) : (
        <ScrollArea
          aria-label="Post outline"
          className="min-h-0 flex-1 overflow-y-auto pr-4"
        >
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
    </aside>
  );
};