import { ComponentConfig } from "@puckeditor/core";

import { Responsive } from "@/puck/utils/responsive";

import { DimensionField, DimensionProps } from "@/puck/fields/dimension";

import { getDimensionVars } from "@/puck/utils/get-style-vars";
import { FormField, type HydratedFormProps } from "@/puck/fields/form";

import { FormBlockUi } from "./ui/form";

export type FormBlockProps = {
  form?: HydratedFormProps;
  dimension?: Responsive<DimensionProps>;
};

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
  render: ({ form, dimension }) => {
    const styleVars = {
      ...getDimensionVars(dimension),
    };

    return <FormBlockUi form={form} styleVars={styleVars} />;
  },
};
