import { ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { TEXT_DEFAULT_PROPS } from "../defaults";

import type { TextBlockProps } from "./types";
import { renderTextBlock } from "./render";

export type { TextBlockProps };

export const Text: ComponentConfig<TextBlockProps> = {
  // The paragraph is the block root; the render attaches `puck.dragRef` to it
  // and `inline` is Puck's only supported way to skip its wrapper `div`.
  inline: true,
  fields: {
    text: {
      type: "textarea",
      label: "Text",
    },
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: TEXT_DEFAULT_PROPS,
  render: renderTextBlock,
};
