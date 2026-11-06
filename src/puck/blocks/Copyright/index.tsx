import { ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { LinksField } from "@/puck/fields/link";
import { TypographyField } from "@/puck/fields/typography";

import { COPYRIGHT_DEFAULT_TYPOGRAPHY } from "./defaults";
import type { CopyrightBlockProps } from "./types";
import { renderCopyrightBlock } from "./render";

export type { CopyrightBlockProps };

export const Copyright: ComponentConfig<CopyrightBlockProps> = {
  fields: {
    showYear: {
      type: "radio",
      label: "Year",
      options: [
        { label: "Show current year", value: true },
        { label: "Hide year", value: false },
      ],
    },
    extraText: {
      type: "textarea",
      label: "Extra text",
    },
    links: LinksField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: {
    showYear: true,
    extraText: "",
    links: [],
    typography: COPYRIGHT_DEFAULT_TYPOGRAPHY,
  },
  render: renderCopyrightBlock,
};
