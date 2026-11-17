import { ComponentConfig } from "@puckeditor/core";

import { richTextFields } from "@/puck/fields/rich-text";
import { SizeField } from "@/puck/fields/size";
import { SpacingField } from "@/puck/fields/spacing";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { TEXT_DEFAULT_PROPS } from "../defaults";

import type { TextBlockProps } from "./types";
import { renderTextBlock } from "./render";

export type { TextBlockProps };

export const Text: ComponentConfig<TextBlockProps> = {
  // The div is the block root; the render attaches `puck.dragRef` to it and
  // `inline` is Puck's only supported way to skip its wrapper `div`.
  inline: true,
  fields: {
    text: richTextFields.text,
    layout: DisplayOnlyLayoutField,
    size: SizeField,
    spacing: SpacingField,
    typography: TypographyField,
  },
  defaultProps: TEXT_DEFAULT_PROPS,
  render: renderTextBlock,
};
