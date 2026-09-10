"use client";

import "client-only";

import { useEditorState, type Editor } from "@tiptap/react";

import { countWordsFromText } from "@/shared/components/tiptap-renderer/helpers/words-counter";
import { estimateReadingTime } from "./lib/writing-metrics";

interface WritingMetricsProps {
  editor: Editor | null;
}

export function WritingMetrics({ editor }: WritingMetricsProps) {
  const metrics = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return { wordCount: 0, readingTime: 0 };
      }

      const wordCount = countWordsFromText(editor.getText());

      return {
        wordCount,
        readingTime: estimateReadingTime(wordCount),
      };
    },
  });

  if (!metrics) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
      <span>{metrics.wordCount} words</span>
      <span aria-hidden="true">·</span>
      <span>{metrics.readingTime} min read</span>
    </div>
  );
}
