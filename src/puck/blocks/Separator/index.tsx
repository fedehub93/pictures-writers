import { type ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { SEPARATOR_DEFAULT_PROPS } from "../defaults";

import type { SeparatorBlockProps } from "./types";
import { renderSeparatorBlock } from "./render";

export type { SeparatorBlockProps };

export const SeparatorBlock: ComponentConfig<SeparatorBlockProps> = {
  // The box that carries the authored dimension is the block root; the render
  // attaches `puck.dragRef` to it and `inline` is Puck's only supported way to
  // skip its wrapper `div`.
  inline: true,
  fields: {
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
  },
  defaultProps: SEPARATOR_DEFAULT_PROPS,
  render: renderSeparatorBlock,
};
