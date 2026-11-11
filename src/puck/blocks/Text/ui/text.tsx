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
    // The paragraph is the block: no editor-only wrapper sits between it and
    // its parent, so this is the element the editor selects and outlines.
    <p
      ref={dragRef}
      className={cn(
        "puck-dim puck-typo whitespace-pre-line puck-block-root",
        layoutClassName,
      )}
      style={styleVars}
    >
      {text}
    </p>
  );
};
