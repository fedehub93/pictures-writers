import { ReactNode } from "react";
import { ComponentConfig } from "@puckeditor/core";

import { cn } from "@/lib/utils";

import { RichTextField } from "@/puck/fields/rich-text";

import { getTypographyProps } from "@/puck/utils/typography";
import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { TypographyField, TypographyProps } from "@/puck/fields/typography";
import { getDimensionProps } from "@/puck/utils/dimension";

export type HeadingProps = {
  text?: ReactNode;
  dimension?: DimensionProps;
  typography?: TypographyProps;
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
    const dimensionProps = getDimensionProps(dimension);
    const typoProps = getTypographyProps(typography);
    return (
      <span
        className={cn(typoProps.className)}
        style={{
          display: "block",
          ...dimensionProps.style,
          ...typoProps.style,
        }}
      >
        {text}
      </span>
    );
  },
};
