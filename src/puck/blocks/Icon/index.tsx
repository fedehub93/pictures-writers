import { type ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";
import { IconField } from "@/puck/fields/icon";

import type { IconBlockProps } from "./types";
import { renderIconBlock } from "./render";

export type { IconBlockProps };

export const IconBlock: ComponentConfig<IconBlockProps> = {
  // The rendered `<svg>` is the block root; the render attaches
  // `puck.dragRef` to it and `inline` is Puck's only supported way to skip its
  // wrapper `div`.
  inline: true,
  fields: {
    icon: IconField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  render: renderIconBlock,
};
