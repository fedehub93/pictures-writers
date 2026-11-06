import { ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { LinksField } from "@/puck/fields/link";
import { TypographyField } from "@/puck/fields/typography";

import type { LinkListBlockProps } from "./types";
import { renderLinkListBlock } from "./render";

export type { LinkListBlockProps };

export const LinkList: ComponentConfig<LinkListBlockProps> = {
  fields: {
    title: {
      type: "text",
      label: "Title",
    },
    links: LinksField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: {
    title: "Links",
    links: [],
  },
  render: renderLinkListBlock,
};
