import { type ComponentConfig } from "@puckeditor/core";

import { LayoutField } from "@/puck/fields/layout";
import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { DecorationField } from "@/puck/fields/decoration";

import { GRID_DEFAULT_PROPS } from "../defaults";

import type { GridBlockProps } from "./types";
import { renderGridBlock } from "./render";

export type { GridBlockProps };

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
  defaultProps: GRID_DEFAULT_PROPS,
  render: renderGridBlock,
};
