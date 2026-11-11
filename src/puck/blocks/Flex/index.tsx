import { type ComponentConfig } from "@puckeditor/core";

import { LayoutField } from "@/puck/fields/layout";
import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { DecorationField } from "@/puck/fields/decoration";

import { FLEX_DEFAULT_PROPS } from "../defaults";

import type { FlexBlockProps } from "./types";
import { renderFlexBlock } from "./render";

export type { FlexBlockProps };

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
  defaultProps: FLEX_DEFAULT_PROPS,
  render: renderFlexBlock,
};
