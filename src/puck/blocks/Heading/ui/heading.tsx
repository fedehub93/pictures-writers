import { type ReactNode } from "react";

import type { BlockDragRef } from "@/puck/types";
import { cn } from "@/shared/lib/utils";

export const HeadingBlockUi = ({
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
    // The block root is the box the parent lays out, so the editor selects
    // this element instead of a wrapper inserted around it.
    <div
      ref={dragRef}
      className={cn("block puck-dim puck-typo", layoutClassName)}
      style={styleVars}
    >
      {text}
    </div>
  );
};
