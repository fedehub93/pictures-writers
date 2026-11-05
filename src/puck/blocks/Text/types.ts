import type { ReactNode } from "react";

import type { AlignType } from "@/puck/fields/typography/types";

export type TextBlockProps = {
  /**
   * Inline text content.
   *
   * A plain string today (textarea field). Typed as ReactNode so the field can
   * move to rich text later without changing the block props or its render.
   */
  text?: ReactNode;
  align?: AlignType;
  color?: string;
};
