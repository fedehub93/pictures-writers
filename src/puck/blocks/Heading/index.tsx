import { type ComponentConfig } from "@puckeditor/core";

import { RichTextField } from "@/puck/fields/rich-text";
import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";

import type { HeadingProps } from "./types";
import { renderHeadingBlock } from "./render";

export type { HeadingProps };

export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: RichTextField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: {
    text: "Heading",
  },
  render: renderHeadingBlock,
};
