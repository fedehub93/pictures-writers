import { type ComponentConfig } from "@puckeditor/core";

import { richTextFields } from "@/puck/fields/rich-text";
import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { HEADING_DEFAULT_PROPS } from "../defaults";

import type { HeadingProps } from "./types";
import { renderHeadingBlock } from "./render";

export type { HeadingProps };

export const Heading: ComponentConfig<HeadingProps> = {
  // The block root is the element the render attaches `puck.dragRef` to;
  // `inline` is Puck's only supported way to skip its wrapper `div`.
  inline: true,
  fields: {
    text: richTextFields.heading,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: HEADING_DEFAULT_PROPS,
  render: renderHeadingBlock,
};
