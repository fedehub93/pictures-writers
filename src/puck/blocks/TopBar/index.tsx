import { ComponentConfig } from "@puckeditor/core";

import { DecorationField } from "@/puck/fields/decoration";
import { DimensionField } from "@/puck/fields/dimension";
import { LayoutField } from "@/puck/fields/layout";

import {
  TOP_BAR_DEFAULT_DECORATION,
  TOP_BAR_DEFAULT_DIMENSION,
  TOP_BAR_DEFAULT_LAYOUT,
} from "./defaults";
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
  fields: {
    content: {
      type: "slot",
    },
    settings: TopBarSettingsField,
    layout: LayoutField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: {
    content: [],
    settings: { dismissible: false },
    layout: TOP_BAR_DEFAULT_LAYOUT,
    dimension: TOP_BAR_DEFAULT_DIMENSION,
    decoration: TOP_BAR_DEFAULT_DECORATION,
  },
  render: renderTopBarBlock,
};
