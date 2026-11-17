import type { ReactNode } from "react";

import type { Responsive } from "@/puck/utils/responsive";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { LayoutProps } from "@/puck/fields/layout";
import type { TypographyProps } from "@/puck/fields/typography";

export type TextBlockProps = {
  /**
   * Authored rich text HTML.
   *
   * The field is a `richtext` descriptor shared with the public render config:
   * the canvas mounts Puck's editor in place of the value, and the
   * published page resolves the same stored HTML with the same schema.
   */
  text?: ReactNode;
  layout?: Responsive<LayoutProps>;
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
  typography?: Responsive<TypographyProps>;
};
