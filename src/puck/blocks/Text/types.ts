import type { ReactNode } from "react";

import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { LayoutProps } from "@/puck/fields/layout";
import type { TypographyProps } from "@/puck/fields/typography";

export type TextBlockProps = {
  /**
   * Authored rich text HTML.
   *
   * The field is a `richtext` descriptor shared with the public render config:
   * the canvas mounts Puck's inline editor in place of the value, and the
   * published page resolves the same stored HTML with the same schema.
   */
  text?: ReactNode;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};
