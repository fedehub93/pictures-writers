import { type ComponentConfig } from "@puckeditor/core";

import { LayoutField } from "@/puck/fields/layout";
import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { DecorationField } from "@/puck/fields/decoration";

import type { ContainerBlockProps } from "./types";
import { renderContainerBlock } from "./render";

export type { ContainerBlockProps };

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
        display: "block",
      },
    },
  },
  render: renderContainerBlock,
};
