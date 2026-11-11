import { ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";
import { TypographyField } from "@/puck/fields/typography";

import { LINK_LIST_DEFAULT_PROPS } from "../defaults";

import { LinkListContentField } from "./field";
import type { LinkListBlockProps } from "./types";
import { renderLinkListBlock } from "./render";

export type { LinkListBlockProps };

export const LinkList: ComponentConfig<LinkListBlockProps> = {
  // The column rendered by `LinkListBlockUi` is the block root and receives
  // `puck.dragRef`; `inline` is Puck's only supported way to skip its wrapper.
  inline: true,
  fields: {
    content: LinkListContentField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: LINK_LIST_DEFAULT_PROPS,
  render: renderLinkListBlock,
};
