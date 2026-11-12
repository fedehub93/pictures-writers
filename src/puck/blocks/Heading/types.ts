import type { ReactNode } from "react";

import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { LayoutProps } from "@/puck/fields/layout";
import type { TypographyProps } from "@/puck/fields/typography";

import type { HeadingLevel } from "./level";

export type HeadingProps = {
  text?: ReactNode;
  /**
   * The heading element the block emits.
   *
   * Semantics, not styling: it is not responsive, and the render validates it
   * against the closed `HEADING_LEVELS` list before producing a tag.
   */
  level?: HeadingLevel;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};
