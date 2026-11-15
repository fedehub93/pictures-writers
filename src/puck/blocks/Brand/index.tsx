import { ComponentConfig, type PuckComponent } from "@puckeditor/core";

import { SizeField } from "@/puck/fields/size";
import { SpacingField } from "@/puck/fields/spacing";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";
import { TypographyField } from "@/puck/fields/typography";
import { readSiteRegionMetadata } from "@/puck/metadata";

import { BRAND_DEFAULT_PROPS } from "../defaults";

import { BrandContentField } from "./field";
import type { BrandBlockProps } from "./types";
import { renderBrandBlock } from "./render";

export type { BrandBlockProps };

/**
 * Canvas renderer for the Brand block.
 *
 * The Site region editor passes Installation details through Puck metadata, so
 * the toggles have something visible to add or remove while designing. Reading
 * it from `puck.metadata` keeps the editor path free of database imports and
 * browser fetches; the public renderer keeps using the server values.
 */
const BrandEditorRender: PuckComponent<BrandBlockProps> = ({
  puck,
  ...props
}) =>
  renderBrandBlock({
    ...props,
    editing: puck.isEditing,
    // The block declares `inline`, so Puck hands it the selection ref instead
    // of wrapping it; the UI attaches it to the block root.
    dragRef: puck.dragRef,
    metadata: readSiteRegionMetadata(puck.metadata),
  });

export const Brand: ComponentConfig<BrandBlockProps> = {
  // The row rendered by `BrandBlockUi` is the block root and receives
  // `puck.dragRef`; `inline` is Puck's only supported way to skip its wrapper.
  inline: true,
  fields: {
    content: BrandContentField,
    layout: DisplayOnlyLayoutField,
    size: SizeField,
    spacing: SpacingField,
    typography: TypographyField,
  },
  defaultProps: BRAND_DEFAULT_PROPS,
  render: BrandEditorRender,
};
