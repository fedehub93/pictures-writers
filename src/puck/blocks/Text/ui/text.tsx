import type { ReactNode } from "react";

import type { BlockDragRef } from "@/puck/types";
import { cn } from "@/shared/lib/utils";

export const TextBlockUi = ({
  text,
  styleVars,
  layoutClassName,
  dragRef,
}: {
  text?: ReactNode;
  styleVars: Record<string, string>;
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
}) => {
  return (
    // A `div`, not a `p`: Puck's inline editor is itself a block-level `div`
    // and the authored content is a sequence of paragraphs, so a paragraph
    // root could not contain it. The rich text container supplies the
    // authored content's rhythm; the block's own typography is inherited.
    <div
      ref={dragRef}
      className={cn(
        "block puck-dim puck-typo puck-block-root puck-rich-text",
        layoutClassName,
      )}
      style={styleVars}
    >
      {text}
    </div>
  );
};
