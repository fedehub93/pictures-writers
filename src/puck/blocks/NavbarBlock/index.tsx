import { ComponentConfig, type PuckComponent } from "@puckeditor/core";

import { DecorationField } from "@/puck/fields/decoration";
import { SizeField } from "@/puck/fields/size";
import { SpacingField } from "@/puck/fields/spacing";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { NAVBAR_BLOCK_DEFAULT_PROPS } from "../defaults";

import { NavbarContentField } from "./field";
import { NavbarStyleField } from "./style-field";
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
    // The block declares `inline`, so Puck hands it the selection ref instead
    // of wrapping it; the UI attaches it to the block root.
    dragRef: puck.dragRef,
  });

export const NavbarBlock: ComponentConfig<NavbarBlockProps> = {
  // The navigation root is the block root and receives `puck.dragRef`;
  // `inline` is Puck's only supported way to skip its wrapper `div`.
  inline: true,
  fields: {
    content: NavbarContentField,
    appearance: NavbarStyleField,
    layout: DisplayOnlyLayoutField,
    size: SizeField,
    spacing: SpacingField,
    decoration: DecorationField,
  },
  defaultProps: NAVBAR_BLOCK_DEFAULT_PROPS,
  render: NavbarBlockEditorRender,
};
