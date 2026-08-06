import { type Slot, type ComponentConfig } from "@puckeditor/core";

import { Responsive } from "@/puck/utils/responsive";

import { LayoutField, type LayoutProps } from "@/puck/fields/layout";
import { DimensionField, type DimensionProps } from "@/puck/fields/dimension";
import {
  TypographyField,
  type TypographyProps,
} from "@/puck/fields/typography";
import {
  DecorationField,
  type DecorationProps,
} from "@/puck/fields/decoration";

import {
  getDecorationVars,
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";

import { GridBlockUi } from "./ui/grid";

export type GridBlockProps = {
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
  items: Slot;
};

export const GridBlock: ComponentConfig<GridBlockProps> = {
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
        display: "grid",
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
      <GridBlockUi
        Items={Items}
        styleVars={styleVars}
        className="[&>[data-puck-component^='Separator']]:self-stretch [&>[data-puck-component]]:flex-1"
      />
    );
  },
};
