import { type ComponentConfig } from "@puckeditor/core";

import { ImageField } from "@/puck/fields/image";
import { DimensionField } from "@/puck/fields/dimension";
import { DecorationField } from "@/puck/fields/decoration";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import type { ImageBlockProps } from "./types";
import { renderImageBlock } from "./render";

export type { ImageBlockProps };

export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  fields: {
    image: ImageField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: {},
  render: renderImageBlock,
};
