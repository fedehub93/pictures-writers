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
import { ContainerBlockUi } from "./ui/container-block-ui";

export type ContainerBlockProps = {
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
  items: Slot;
};

export const ContainerBlock: ComponentConfig<ContainerBlockProps> = {
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
      <ContainerBlockUi
        Items={Items}
        styleVars={styleVars}
        className="[&>[data-puck-component^='Separator']]:self-stretch [&>[data-puck-component]]:flex-1"
      />
    );
  },
};
