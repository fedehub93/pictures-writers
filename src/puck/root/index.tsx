import { RootConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";

import type { RootProps } from "./types";
import { renderRoot } from "./render";

export type { RootProps };

export const RootEditor: RootConfig<RootProps> = {
  fields: {
    title: { type: "text", label: "Title" },
    dimension: DimensionField,
  },
  render: renderRoot,
};
