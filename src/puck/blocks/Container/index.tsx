import { type ComponentConfig } from "@puckeditor/core";

import { LayoutField } from "@/puck/fields/layout";
import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { DecorationField } from "@/puck/fields/decoration";

import { CONTAINER_DEFAULT_PROPS } from "../defaults";

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
  defaultProps: CONTAINER_DEFAULT_PROPS,
  render: renderContainerBlock,
};
