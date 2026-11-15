import { type ComponentConfig } from "@puckeditor/core";

import { LayoutField } from "@/puck/fields/layout";
import { SizeField } from "@/puck/fields/size";
import { SpacingField } from "@/puck/fields/spacing";
import { TypographyField } from "@/puck/fields/typography";
import { DecorationField } from "@/puck/fields/decoration";

import { FLEX_DEFAULT_PROPS } from "../defaults";

import type { FlexBlockProps } from "./types";
import { renderFlexBlock } from "./render";

export type { FlexBlockProps };

export const FlexBlock: ComponentConfig<FlexBlockProps> = {
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
  defaultProps: FLEX_DEFAULT_PROPS,
  render: renderFlexBlock,
};
