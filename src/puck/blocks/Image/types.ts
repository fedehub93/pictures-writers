import type { Responsive } from "@/puck/utils/responsive";
import type { ImageProps } from "@/puck/fields/image";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { DecorationProps } from "@/puck/fields/decoration";

export type ImageBlockProps = {
  image?: ImageProps;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
};
