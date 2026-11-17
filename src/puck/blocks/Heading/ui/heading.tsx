import { createElement, type ReactNode } from "react";

import type { BlockDragRef } from "@/puck/types";
import { cn } from "@/shared/lib/utils";

import { resolveHeadingLevel, type HeadingLevel } from "../level";

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
  // to the default heading instead of rendering arbitrary markup. `createElement`
  // keeps the resolved name a value rather than a component in JSX, which the
  // compiler lint would read as one created during render.
  return createElement(
    resolveHeadingLevel(level),
    {
      ref: dragRef,
      // The heading is the block root: the editor selects the element the
      // public page publishes, and the inline rich text editor is its
      // descendant. The shared `puck-rich-text` class supplies the authored
      // content's rhythm.
      className: cn(
        "block puck-dim puck-typo puck-block-root puck-rich-text",
        layoutClassName,
      ),
      style: styleVars,
    },
    text,
  );
};
