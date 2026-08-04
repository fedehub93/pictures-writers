import { type Slot, type ComponentConfig } from "@puckeditor/core";

import { Responsive } from "@/puck/utils/responsive";

import {
  getLayoutVars,
  LayoutField,
  type LayoutProps,
} from "@/puck/fields/layout";
import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { TypographyField, TypographyProps } from "@/puck/fields/typography";
import { DecorationField, DecorationProps } from "@/puck/fields/decoration";

import {
  getDecorationVars,
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

import { FlexBlockUi } from "./ui/flex-block-ui";

export type FlexBlockProps = {
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
  items: Slot;
};

export const FlexBlock: ComponentConfig<FlexBlockProps> = {
  fields: {
    layout: LayoutField,
    dimension: DimensionField,
    typography: TypographyField,
    decoration: DecorationField,
    items: {
      type: "slot",
    },
  },
  defaultProps: {
    items: [],
    layout: {
      desktop: {
        display: "flex",
      },
    },
  },
  render: ({ layout, dimension, typography, decoration, items: Items }) => {
    const styleVars = {
      ...getLayoutVars(layout),
      ...getDimensionVars(dimension),
      ...getTypographyVars(typography),
      ...getDecorationVars(decoration),
    };
    return (
      <FlexBlockUi
        Items={Items}
        styleVars={styleVars}
        className="[&>[data-puck-component^='Separator']]:self-stretch [&>[data-puck-component]]:flex-1"
      />
    );
  },
};
