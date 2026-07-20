"use client";

import type { FormDisplayInstance } from "../../../types/core";
import { TipTapRenderer } from "../../../tiptap/tiptap-renderer";

export function ParagraphFormComponent({
  elementInstance,
}: {
  elementInstance: FormDisplayInstance<"Paragraph">;
}) {
  const { content } = elementInstance.properties;

  return (
    <div className="text-xs text-muted-foreground">
      <TipTapRenderer content={content} />
    </div>
  );
}
