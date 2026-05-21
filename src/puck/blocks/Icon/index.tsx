import { ReactNode } from "react";
import { ComponentConfig } from "@puckeditor/core";

import { Responsive } from "@/puck/utils/responsive";

import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { TypographyField, TypographyProps } from "@/puck/fields/typography";

import {
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { IconField, IconProps } from "@/puck/fields/icon";
import { IconBlockUi } from "./ui/icon";

export type IconBlockProps = {
  icon?: IconProps;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};

export const IconBlock: ComponentConfig<IconBlockProps> = {
  fields: {
    icon: IconField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  render: ({ icon, dimension, typography }) => {
    const styleVars = {
      ...getDimensionVars(dimension),
      ...getTypographyVars(typography),
    };

    return <IconBlockUi icon={icon} styleVars={styleVars} />;
  },
};
