import { ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";

import type { TextBlockProps } from "./types";
import { renderTextBlock } from "./render";

export type { TextBlockProps };

export const Text: ComponentConfig<TextBlockProps> = {
  fields: {
    text: {
      type: "textarea",
      label: "Text",
    },
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: {
    text: "Add your text here.",
  },
  render: renderTextBlock,
};
