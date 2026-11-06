import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { LayoutProps } from "@/puck/fields/layout";
import type { HydratedFormProps } from "@/puck/fields/form";

export type FormBlockProps = {
  form?: HydratedFormProps;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
};
