import { ComponentConfig, type PuckComponent } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";
import { TypographyField } from "@/puck/fields/typography";
import { readSiteRegionMetadata } from "@/puck/metadata";

import { COPYRIGHT_DEFAULT_PROPS } from "../defaults";

import { CopyrightContentField } from "./field";
import type { CopyrightBlockProps } from "./types";
import { renderCopyrightBlock } from "./render";

export type { CopyrightBlockProps };

/**
 * Canvas renderer for the Copyright block.
 *
 * The Site region editor passes Installation details through Puck metadata, so
 * the footer line previews the real site name while designing. Reading it from
 * `puck.metadata` keeps the editor path free of database imports and browser
 * fetches; the public renderer keeps using the server values.
 *
 * This is the block's only editor-only entry, and the only caller that passes
 * `editing: puck.isEditing` to the shared render. The public entry in
 * `render-config.tsx` keeps `CopyrightServer`, so the published footer ships no
 * client JavaScript for the block. See the registry comment in `config.ts`.
 */
const CopyrightEditorRender: PuckComponent<CopyrightBlockProps> = ({
  puck,
  ...props
}) =>
  renderCopyrightBlock({
    ...props,
    editing: puck.isEditing,
    // The block declares `inline`, so Puck hands it the selection ref instead
    // of wrapping it; the UI attaches it to the block root.
    dragRef: puck.dragRef,
    metadata: readSiteRegionMetadata(puck.metadata),
  });

export const Copyright: ComponentConfig<CopyrightBlockProps> = {
  // The line rendered by `CopyrightBlockUi` is the block root and receives
  // `puck.dragRef`; `inline` is Puck's only supported way to skip its wrapper.
  inline: true,
  fields: {
    content: CopyrightContentField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: COPYRIGHT_DEFAULT_PROPS,
  render: CopyrightEditorRender,
};
