import { ComponentConfig } from "@puckeditor/core";

import { MenuItemsField } from "./field";
import type { NavbarBlockProps } from "./types";
import { NavbarBlockUi } from "./ui/navbar-block";

export type { NavbarBlockProps };

const LAYOUT_OPTIONS: { label: string; value: NavbarBlockProps["layout"] }[] = [
  { label: "Mega menu", value: "mega" },
  { label: "Compact menu", value: "compact" },
];

export const NavbarBlock: ComponentConfig<NavbarBlockProps> = {
  fields: {
    layout: {
      type: "radio",
      label: "Desktop layout",
      options: LAYOUT_OPTIONS,
    },
    items: MenuItemsField,
  },
  defaultProps: {
    layout: "mega",
    items: [
      {
        type: "link",
        label: "Home",
        link: { type: "external", url: "/" },
      },
    ],
  },
  render: ({ items, layout }) => (
    <NavbarBlockUi items={items} layout={layout} />
  ),
};
