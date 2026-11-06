import type { ReactNode } from "react";

import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { LayoutProps } from "@/puck/fields/layout";
import type { TypographyProps } from "@/puck/fields/typography";

export type TextBlockProps = {
  /**
   * Plain multi-line text content.
   *
   * Typed as ReactNode so the field can move to rich text later without
   * changing the block props or its render.
   */
  text?: ReactNode;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};
