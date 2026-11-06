import { ComponentConfig } from "@puckeditor/core";

import { LinksField } from "@/puck/fields/link";

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
  },
  defaultProps: {
    title: "Links",
    links: [],
  },
  render: renderLinkListBlock,
};
