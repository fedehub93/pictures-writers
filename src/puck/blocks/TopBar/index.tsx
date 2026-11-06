import { ComponentConfig } from "@puckeditor/core";

import { DecorationField } from "@/puck/fields/decoration";
import { DimensionField } from "@/puck/fields/dimension";

import {
  TOP_BAR_DEFAULT_DECORATION,
  TOP_BAR_DEFAULT_DIMENSION,
} from "./defaults";
import { TopBarSettingsField } from "./field";
import type { TopBarBlockProps } from "./types";
import { renderTopBarBlock } from "./render";

export type { TopBarBlockProps };

/**
 * A generic strip above the header.
 *
 * The Top bar owns no copy: `content` is a Puck slot for arbitrary blocks, and
 * the only authored setting is whether visitors can dismiss it. The shared
 * Dimension and Decoration fields style the strip.
 */
export const TopBar: ComponentConfig<TopBarBlockProps> = {
  fields: {
    content: {
      type: "slot",
    },
    settings: TopBarSettingsField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: {
    content: [],
    settings: { dismissible: false },
    dimension: TOP_BAR_DEFAULT_DIMENSION,
    decoration: TOP_BAR_DEFAULT_DECORATION,
  },
  render: renderTopBarBlock,
};
