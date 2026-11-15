import type { Slot } from "@puckeditor/core";

import type { Responsive } from "@/puck/utils/responsive";
import type { LayoutProps } from "@/puck/fields/layout";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { TypographyProps } from "@/puck/fields/typography";
import type { DecorationProps } from "@/puck/fields/decoration";

export type GridBlockProps = {
  layout?: Responsive<LayoutProps>;
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
  items: Slot;
};
