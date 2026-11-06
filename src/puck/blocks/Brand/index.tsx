import { ComponentConfig, type PuckComponent } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { readSiteRegionMetadata } from "@/puck/metadata";

import { BRAND_DEFAULT_CONTENT, BRAND_DEFAULT_TYPOGRAPHY } from "./defaults";
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
    metadata: readSiteRegionMetadata(puck.metadata),
  });

export const Brand: ComponentConfig<BrandBlockProps> = {
  fields: {
    content: BrandContentField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: {
    content: BRAND_DEFAULT_CONTENT,
    typography: BRAND_DEFAULT_TYPOGRAPHY,
  },
  render: BrandEditorRender,
};
