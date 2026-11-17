import { RootConfig } from "@puckeditor/core";

import { SizeField } from "@/puck/fields/size";
import { SpacingField } from "@/puck/fields/spacing";
import { RootLayoutField } from "@/puck/fields/layout";
import { DecorationField } from "@/puck/fields/decoration";

import type { RootProps } from "./types";
import { renderRoot } from "./render";

export type { RootProps };

export const RootEditor: RootConfig<RootProps> = {
  fields: {
    layout: RootLayoutField,
    size: SizeField,
    spacing: SpacingField,
    decoration: DecorationField,
  },
  render: renderRoot,
};
