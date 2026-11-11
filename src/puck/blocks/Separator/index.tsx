import { type ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { SEPARATOR_DEFAULT_PROPS } from "../defaults";

import type { SeparatorBlockProps } from "./types";
import { renderSeparatorBlock } from "./render";

export type { SeparatorBlockProps };

export const SeparatorBlock: ComponentConfig<SeparatorBlockProps> = {
  fields: {
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
  },
  defaultProps: SEPARATOR_DEFAULT_PROPS,
  render: renderSeparatorBlock,
};
