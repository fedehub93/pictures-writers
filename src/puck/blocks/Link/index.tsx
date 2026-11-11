import { type ComponentConfig } from "@puckeditor/core";

import { createDimensionField } from "@/puck/fields/dimension";
import { DecorationField } from "@/puck/fields/decoration";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";
import { LinkField } from "@/puck/fields/link";

import { LINK_DEFAULT_PROPS } from "../defaults";

import type { LinkBlockProps } from "./types";
import { renderLinkBlock } from "./render";
import { LINK_BASE_WIDTH } from "./constants";

export type { LinkBlockProps };

export const LinkBlock: ComponentConfig<LinkBlockProps> = {
  // The rendered anchor is the block root; the render hands `puck.dragRef` to
  // it and `inline` is Puck's only supported way to skip its wrapper `div`.
  inline: true,
  fields: {
    link: LinkField,
    layout: DisplayOnlyLayoutField,
    dimension: createDimensionField({ baseWidth: LINK_BASE_WIDTH }),
    typography: TypographyField,
    decoration: DecorationField,
  },
  defaultProps: LINK_DEFAULT_PROPS,
  render: renderLinkBlock,
};
