import { type ComponentConfig } from "@puckeditor/core";

import { ImageField } from "@/puck/fields/image";
import { DimensionField } from "@/puck/fields/dimension";
import { DecorationField } from "@/puck/fields/decoration";

import type { ImageBlockProps } from "./types";
import { renderImageBlock } from "./render";

export type { ImageBlockProps };

export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  fields: {
    image: ImageField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: {},
  render: renderImageBlock,
};
