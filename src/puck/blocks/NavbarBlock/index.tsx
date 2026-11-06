import { ComponentConfig, type PuckComponent } from "@puckeditor/core";

import { DecorationField } from "@/puck/fields/decoration";
import { DimensionField } from "@/puck/fields/dimension";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { NAVBAR_BLOCK_DEFAULT_CONTENT } from "./defaults";
import { NavbarContentField } from "./field";
import type { NavbarBlockProps } from "./types";
import { renderNavbarBlock } from "./render";

export type { NavbarBlockProps };

const NavbarBlockEditorRender: PuckComponent<NavbarBlockProps> = ({
  puck,
  ...props
}) =>
  renderNavbarBlock({
    ...props,
    editing: puck.isEditing,
  });

export const NavbarBlock: ComponentConfig<NavbarBlockProps> = {
  fields: {
    content: NavbarContentField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: {
    content: NAVBAR_BLOCK_DEFAULT_CONTENT,
  },
  render: NavbarBlockEditorRender,
};
