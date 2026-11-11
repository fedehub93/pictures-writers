import { type ComponentConfig } from "@puckeditor/core";

import { DimensionField } from "@/puck/fields/dimension";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";
import { FormField } from "@/puck/fields/form";

import { FORM_DEFAULT_PROPS } from "../defaults";

import type { FormBlockProps } from "./types";
import { renderFormBlock } from "./render";

export type { FormBlockProps };

export const FormBlock: ComponentConfig<FormBlockProps> = {
  fields: {
    form: FormField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
  },
  defaultProps: FORM_DEFAULT_PROPS,
  render: renderFormBlock,
};
