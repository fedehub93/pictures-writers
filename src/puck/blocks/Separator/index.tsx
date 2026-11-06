import { type ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";

import type { SeparatorBlockProps } from "./types";
import { renderSeparatorBlock } from "./render";

export type { SeparatorBlockProps };

export const SeparatorBlock: ComponentConfig<SeparatorBlockProps> = {
  fields: {
    dimension: DimensionField,
  },
  defaultProps: {
    dimension: {
      desktop: {
        width: "100%",
        height: "2px",
      },
    },
  },
  render: renderSeparatorBlock,
};
