import type { ReactNode } from "react";

import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";

export type HeadingProps = {
  text?: ReactNode;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};
