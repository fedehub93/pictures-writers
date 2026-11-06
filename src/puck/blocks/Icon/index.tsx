import { type ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";
import { IconField } from "@/puck/fields/icon";

import type { IconBlockProps } from "./types";
import { renderIconBlock } from "./render";

export type { IconBlockProps };

export const IconBlock: ComponentConfig<IconBlockProps> = {
  fields: {
    icon: IconField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  render: renderIconBlock,
};
