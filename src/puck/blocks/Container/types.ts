import type { Slot } from "@puckeditor/core";

import type { Responsive } from "@/puck/utils/responsive";
import type { LayoutProps } from "@/puck/fields/layout";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type { DecorationProps } from "@/puck/fields/decoration";

export type ContainerBlockProps = {
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
  items: Slot;
};
