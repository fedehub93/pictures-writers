import type { ReactNode } from "react";

import type { Responsive } from "@/puck/utils/responsive";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { LayoutProps } from "@/puck/fields/layout";
import type { DecorationProps } from "@/puck/fields/decoration";

export type RootProps = {
  children: ReactNode;
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
  layout?: Responsive<LayoutProps>;
  decoration?: Responsive<DecorationProps>;
};
