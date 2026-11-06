import type { ReactNode } from "react";

import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";

export type RootProps = {
  children: ReactNode;
  title?: string;
  dimension?: Responsive<DimensionProps>;
};
