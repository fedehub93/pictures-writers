import { ReactNode } from "react";
import { RootConfig } from "@puckeditor/core";

import { Responsive } from "@/puck/utils/responsive";

import { DimensionField, DimensionProps } from "@/puck/fields/dimension";

import { getDimensionVars } from "@/puck/utils/get-style-vars";

import { RootBlockUi } from "./ui/root";

export type RootProps = {
  children: ReactNode;
  title?: string;
  dimension?: Responsive<DimensionProps>;
};

export const RootEditor: RootConfig<RootProps> = {
  fields: {
    title: { type: "text" },
    dimension: DimensionField,
  },
  render: ({ children, dimension }) => {
    const styleVars = {
      ...getDimensionVars(dimension),
    };

    return <RootBlockUi styleVars={styleVars}>{children}</RootBlockUi>;
  },
};
