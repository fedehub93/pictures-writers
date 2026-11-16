import { type ComponentConfig } from "@puckeditor/core";

import { richTextFields } from "@/puck/fields/rich-text";
import { SizeField } from "@/puck/fields/size";
import { SpacingField } from "@/puck/fields/spacing";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { HEADING_DEFAULT_PROPS } from "../defaults";

import type { HeadingProps } from "./types";
import { HeadingLevelField } from "./field";
import { renderHeadingBlock } from "./render";

export type { HeadingProps };

export const Heading: ComponentConfig<HeadingProps> = {
  // The block root is the element the render attaches `puck.dragRef` to;
  // `inline` is Puck's only supported way to skip its wrapper `div`.
  inline: true,
  fields: {
    text: richTextFields.heading,
    level: HeadingLevelField,
    layout: DisplayOnlyLayoutField,
    size: SizeField,
    spacing: SpacingField,
    typography: TypographyField,
  },
  defaultProps: HEADING_DEFAULT_PROPS,
  render: renderHeadingBlock,
};
