import type { Responsive } from "@/puck/utils/responsive";
import type { ImageProps } from "@/puck/fields/image";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { DecorationProps } from "@/puck/fields/decoration";
import type { LayoutProps } from "@/puck/fields/layout";

export type ImageBlockProps = {
  image?: ImageProps;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
};
