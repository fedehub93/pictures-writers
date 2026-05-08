import { ReactNode } from "react";
import { ComponentConfig } from "@puckeditor/core";

import { cn } from "@/lib/utils";

import { RichTextField } from "@/puck/fields/rich-text";

import { getTypographyProps } from "@/puck/utils/typography";
import { TypographyField, TypographyProps } from "@/puck/fields/typography";

export type HeadingProps = {
  text?: ReactNode;
  typography?: TypographyProps;
};

export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: RichTextField,
    typography: TypographyField,
  },
  defaultProps: {
    text: "Heading",
  },
  render: ({ text, typography }) => {
    const typoProps = getTypographyProps(typography);
    return (
      <span
        className={cn(typoProps.className)}
        style={{
          display: "block",
          width: "100%",
          marginLeft: "auto",
          marginRight: "auto",
          ...typoProps.style,
        }}
      >
        {text}
      </span>
    );
  },
};
