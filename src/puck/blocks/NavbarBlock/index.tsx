import { ComponentConfig } from "@puckeditor/core";

import { DecorationField } from "@/puck/fields/decoration";
import { DimensionField } from "@/puck/fields/dimension";

import { NAVBAR_BLOCK_DEFAULT_CONTENT } from "./defaults";
import { NavbarContentField } from "./field";
import type { NavbarBlockProps } from "./types";
import { renderNavbarBlock } from "./render";

export type { NavbarBlockProps };

export const NavbarBlock: ComponentConfig<NavbarBlockProps> = {
  fields: {
    content: NavbarContentField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: {
    content: NAVBAR_BLOCK_DEFAULT_CONTENT,
  },
  render: renderNavbarBlock,
};
