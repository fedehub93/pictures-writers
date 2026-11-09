import { RootConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { RootLayoutField } from "@/puck/fields/layout";
import { DecorationField } from "@/puck/fields/decoration";

import type { RootProps } from "./types";
import { renderRoot } from "./render";

export type { RootProps };

export const RootEditor: RootConfig<RootProps> = {
  fields: {
    title: { type: "text", label: "Title" },
    layout: RootLayoutField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  render: renderRoot,
};
