import { type ComponentConfig } from "@puckeditor/core";

import { LayoutField } from "@/puck/fields/layout";
import { SizeField } from "@/puck/fields/size";
import { SpacingField } from "@/puck/fields/spacing";
import { TypographyField } from "@/puck/fields/typography";
import { DecorationField } from "@/puck/fields/decoration";

import { CONTAINER_DEFAULT_PROPS } from "../defaults";

import type { ContainerBlockProps } from "./types";
import { renderContainerBlock } from "./render";

export type { ContainerBlockProps };

export const ContainerBlock: ComponentConfig<ContainerBlockProps> = {
  // Puck's `inline` branch is the only supported way to skip the per-block
  // wrapper `div`; the render attaches `puck.dragRef` to the slot root. See
  // `SlotSurface` for the contract.
  inline: true,
  fields: {
    layout: LayoutField,
    size: SizeField,
    spacing: SpacingField,
    typography: TypographyField,
    decoration: DecorationField,
    items: {
      type: "slot",
    },
  },
  defaultProps: CONTAINER_DEFAULT_PROPS,
  render: renderContainerBlock,
};
