import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type { IconProps } from "@/puck/fields/icon";

export type IconBlockProps = {
  icon?: IconProps;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};
