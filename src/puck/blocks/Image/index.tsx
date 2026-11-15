import { type ComponentConfig } from "@puckeditor/core";

import { ImageField } from "@/puck/fields/image";
import { SizeField } from "@/puck/fields/size";
import { SpacingField } from "@/puck/fields/spacing";
import { DecorationField } from "@/puck/fields/decoration";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import type { ImageBlockProps } from "./types";
import { renderImageBlock } from "./render";

export type { ImageBlockProps };

/**
 * No `defaultProps`: a freshly dropped image keeps its natural size (ADR-0039,
 * revision). Filling the box stays one authored Size value away, and a
 * default width would also reach every stored document that never declared one
 * once the default is applied on the public render.
 */
export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  // The box that carries the authored size (the `<a>` or the `<div>`) is
  // the block root; the render attaches `puck.dragRef` to it and `inline` is
  // Puck's only supported way to skip its wrapper `div`.
  inline: true,
  fields: {
    image: ImageField,
    layout: DisplayOnlyLayoutField,
    size: SizeField,
    spacing: SpacingField,
    decoration: DecorationField,
  },
  render: renderImageBlock,
};
