import { ComponentConfig, type PuckComponent } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";
import { TypographyField } from "@/puck/fields/typography";

import { LINK_LIST_DEFAULT_PROPS } from "../defaults";

import { LinkListContentField } from "./field";
import type { LinkListBlockProps } from "./types";
import { renderLinkListBlock } from "./render";

export type { LinkListBlockProps };

/**
 * Editor render for the Link list.
 *
 * The block UI stays server-safe — the published footer renders it with no
 * client JavaScript — so the inert-link behaviour lives in this editor-only
 * entry, the only caller that passes `puck.isEditing`. The public entry in
 * `render-config.tsx` keeps `renderLinkListBlock` with the flag omitted. See
 * the registry comment in `config.ts` before giving another block a second
 * render entry.
 */
const LinkListEditorRender: PuckComponent<LinkListBlockProps> = ({
  puck,
  ...props
}) =>
  renderLinkListBlock({
    ...props,
    editing: puck.isEditing,
    // The block declares `inline`, so Puck hands it the selection ref instead
    // of wrapping it; the UI attaches it to the block root.
    dragRef: puck.dragRef,
  });

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
  render: LinkListEditorRender,
};
