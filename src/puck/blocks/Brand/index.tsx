import { ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";

import { BRAND_DEFAULT_TYPOGRAPHY } from "./defaults";
import type { BrandBlockProps } from "./types";
import { renderBrandBlock } from "./render";

export type { BrandBlockProps };

export const Brand: ComponentConfig<BrandBlockProps> = {
  fields: {
    showLogo: {
      type: "radio",
      label: "Logo",
      options: [
        { label: "Show logo", value: true },
        { label: "Hide logo", value: false },
      ],
    },
    showSiteName: {
      type: "radio",
      label: "Site name",
      options: [
        { label: "Show site name", value: true },
        { label: "Hide site name", value: false },
      ],
    },
    customText: {
      type: "text",
      label: "Custom text",
    },
    customLogoUrl: {
      type: "text",
      label: "Custom logo URL",
    },
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: {
    showLogo: true,
    showSiteName: true,
    typography: BRAND_DEFAULT_TYPOGRAPHY,
  },
  render: renderBrandBlock,
};
