import { ComponentConfig } from "@puckeditor/core";

import { DecorationField } from "@/puck/fields/decoration";
import { DimensionField } from "@/puck/fields/dimension";
import { LayoutField } from "@/puck/fields/layout";

import { TOP_BAR_DEFAULT_PROPS } from "../defaults";

import { TopBarSettingsField } from "./field";
import type { TopBarBlockProps } from "./types";
import { renderTopBarBlock } from "./render";

export type { TopBarBlockProps };

/**
 * A generic strip above the header.
 *
 * The Top bar owns no copy: `content` is a Puck slot for arbitrary blocks, and
 * the only other setting is whether visitors can dismiss it. The shared
 * Layout, Dimension and Decoration fields style the strip.
 */
export const TopBar: ComponentConfig<TopBarBlockProps> = {
  // Puck's `inline` branch is the only supported way to skip the per-block
  // wrapper `div`; the render attaches `puck.dragRef` to the strip root, which
  // is the block root. See `TopBarBlockUiProps.dragRef` for why not the slot.
  inline: true,
  fields: {
    content: {
      type: "slot",
    },
    settings: TopBarSettingsField,
    layout: LayoutField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: TOP_BAR_DEFAULT_PROPS,
  render: renderTopBarBlock,
};
