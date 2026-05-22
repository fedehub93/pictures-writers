import { ReactNode } from "react";
import { ComponentConfig } from "@puckeditor/core";

import { cn } from "@/shared/lib/utils";

import { Responsive } from "@/puck/utils/responsive";

import { RichTextField } from "@/puck/fields/rich-text";
import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { TypographyField, TypographyProps } from "@/puck/fields/typography";

import {
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { HeadingBlockUi } from "./ui/heading";

export type HeadingProps = {
  text?: ReactNode;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};

export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: RichTextField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: {
    text: "Heading",
  },
  render: ({ text, dimension, typography }) => {
    const styleVars = {
      ...getDimensionVars(dimension),
      ...getTypographyVars(typography),
    };

    return <HeadingBlockUi text={text} styleVars={styleVars} />;
  },
};
