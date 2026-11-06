import { type ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { FormField } from "@/puck/fields/form";

import type { FormBlockProps } from "./types";
import { renderFormBlock } from "./render";

export type { FormBlockProps };

export const FormBlock: ComponentConfig<FormBlockProps> = {
  fields: {
    form: FormField,
    dimension: DimensionField,
  },
  defaultProps: {
    form: {
      id: "",
      content: null,
      gtmEventName: "",
    },
  },
  render: renderFormBlock,
};
