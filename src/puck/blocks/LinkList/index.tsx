import { ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";

import { LINK_LIST_DEFAULT_CONTENT } from "./defaults";
import { LinkListContentField } from "./field";
import type { LinkListBlockProps } from "./types";
import { renderLinkListBlock } from "./render";

export type { LinkListBlockProps };

export const LinkList: ComponentConfig<LinkListBlockProps> = {
  fields: {
    content: LinkListContentField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: {
    content: LINK_LIST_DEFAULT_CONTENT,
  },
  render: renderLinkListBlock,
};
