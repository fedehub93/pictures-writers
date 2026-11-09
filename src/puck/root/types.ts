import type { ReactNode } from "react";

import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { LayoutProps } from "@/puck/fields/layout";
import type { DecorationProps } from "@/puck/fields/decoration";

export type RootProps = {
  children: ReactNode;
  dimension?: Responsive<DimensionProps>;
  layout?: Responsive<LayoutProps>;
  decoration?: Responsive<DecorationProps>;
};
