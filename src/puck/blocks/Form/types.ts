import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { HydratedFormProps } from "@/puck/fields/form";

export type FormBlockProps = {
  form?: HydratedFormProps;
  dimension?: Responsive<DimensionProps>;
};
