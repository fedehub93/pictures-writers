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
 */
const CopyrightEditorRender: PuckComponent<CopyrightBlockProps> = ({
  puck,
  ...props
}) =>
  renderCopyrightBlock({
    ...props,
    editing: puck.isEditing,
    metadata: readSiteRegionMetadata(puck.metadata),
  });

export const Copyright: ComponentConfig<CopyrightBlockProps> = {
  fields: {
    content: CopyrightContentField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: COPYRIGHT_DEFAULT_PROPS,
  render: CopyrightEditorRender,
};
