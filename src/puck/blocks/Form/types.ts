import type { Responsive } from "@/puck/utils/responsive";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { LayoutProps } from "@/puck/fields/layout";
import type { HydratedFormProps } from "@/puck/fields/form";

export type FormBlockProps = {
  form?: HydratedFormProps;
  layout?: Responsive<LayoutProps>;
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
};
