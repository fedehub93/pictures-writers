import { ComponentConfig } from "@puckeditor/core";

import { Responsive } from "@/puck/utils/responsive";

import { DimensionField, type DimensionProps } from "@/puck/fields/dimension";
import {
  DecorationField,
  type DecorationProps,
} from "@/puck/fields/decoration";

import {
  getDecorationVars,
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

import { LinkBlockUi } from "./ui/link";
import { TypographyField, TypographyProps } from "@/puck/fields/typography";
import { LinkField, LinkProps } from "@/puck/fields/link";

export type LinkBlockProps = {
  link?: LinkProps;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
};

export const LinkBlock: ComponentConfig<LinkBlockProps> = {
  fields: {
    link: LinkField,
    dimension: DimensionField,
    typography: TypographyField,
    decoration: DecorationField,
  },
  defaultProps: {
    link: {
      label: "Link",
      href: "",
    },
    typography: {
      desktop: {
        fontSize: "700",
        color: "var(--primary)",
      },
    },
  },
  render: ({ link, dimension, typography, decoration }) => {
    const styleVars = {
      ...getDimensionVars(dimension),
      ...getTypographyVars(typography),
      ...getDecorationVars(decoration),
    };

    return <LinkBlockUi link={link} styleVars={styleVars} />;
  },
};
