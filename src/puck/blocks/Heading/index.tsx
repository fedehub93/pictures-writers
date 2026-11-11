import { type ComponentConfig } from "@puckeditor/core";

import { RichTextField } from "@/puck/fields/rich-text";
import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { HEADING_DEFAULT_PROPS } from "../defaults";

import type { HeadingProps } from "./types";
import { renderHeadingBlock } from "./render";

export type { HeadingProps };

export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: RichTextField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: HEADING_DEFAULT_PROPS,
  render: renderHeadingBlock,
};
