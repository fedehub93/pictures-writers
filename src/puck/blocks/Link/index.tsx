import { type ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { DecorationField } from "@/puck/fields/decoration";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";
import { LinkField } from "@/puck/fields/link";

import type { LinkBlockProps } from "./types";
import { renderLinkBlock } from "./render";

export type { LinkBlockProps };

export const LinkBlock: ComponentConfig<LinkBlockProps> = {
  fields: {
    link: LinkField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    typography: TypographyField,
    decoration: DecorationField,
  },
  defaultProps: {
    link: {
      type: "external",
      url: "",
      label: "Inserisci il tuo link",
    },
    typography: {
      desktop: {
        fontWeight: "700",
        color: "var(--primary)",
      },
    },
  },
  render: renderLinkBlock,
};
