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
  // A freshly dropped image fills its container, like the old implicit
  // `w-full`. It is an authored value, so the public render (which does not
  // merge defaultProps) receives it too.
  defaultProps: {
    dimension: { desktop: { width: "100%" } },
  },
  render: renderImageBlock,
};
