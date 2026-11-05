import { ComponentConfig } from "@puckeditor/core";

import { LinksField } from "@/puck/fields/link";

import type { LinkListBlockProps } from "./types";
import { LinkListBlockUi } from "./ui/link-list";

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
  render: ({ title, links }) => (
    <LinkListBlockUi title={title} links={links} />
  ),
};
