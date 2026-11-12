import { type ReactNode } from "react";

import type { BlockDragRef } from "@/puck/types";
import { cn } from "@/shared/lib/utils";

import {
  HEADING_DEFAULT_LEVEL,
  isHeadingLevel,
  type HeadingLevel,
} from "../level";

export const HeadingBlockUi = ({
  text,
  level,
  styleVars,
  layoutClassName,
  dragRef,
}: {
  text?: ReactNode;
  level?: HeadingLevel;
  styleVars: Record<string, string>;
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
}) => {
  // A stored value outside the allow-list must never become a tag: it degrades
  // to the default heading instead of rendering arbitrary markup.
  const HeadingTag = isHeadingLevel(level) ? level : HEADING_DEFAULT_LEVEL;

  return (
    // The heading is the block root: the editor selects the element the public
    // page publishes, and the inline rich text editor is its descendant. The
    // shared `puck-rich-text` class supplies the authored content's rhythm.
    <HeadingTag
      ref={dragRef}
      className={cn(
        "block puck-dim puck-typo puck-block-root puck-rich-text",
        layoutClassName,
      )}
      style={styleVars}
    >
      {text}
    </HeadingTag>
  );
};
