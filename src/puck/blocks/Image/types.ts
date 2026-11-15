import type { Responsive } from "@/puck/utils/responsive";
import type { ImageProps } from "@/puck/fields/image";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { DecorationProps } from "@/puck/fields/decoration";
import type { LayoutProps } from "@/puck/fields/layout";

export type ImageBlockProps = {
  image?: ImageProps;
  layout?: Responsive<LayoutProps>;
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
  decoration?: Responsive<DecorationProps>;
};
