import { ComponentConfig } from "@puckeditor/core";

import { Responsive } from "@/puck/utils/responsive";

import { DimensionField, DimensionProps } from "@/puck/fields/dimension";

import { getDimensionVars } from "@/puck/utils/get-style-vars";
import { FormField, FormProps } from "@/puck/fields/form";

import DyanamicForm from "@/components/form-component/dynamic-form";

export type FormBlockProps = {
  form?: FormProps;
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
      name: "",
      fields: "",
      submitLabel: "",
      gtmEventName: "",
    },
  },
  render: ({ form, dimension }) => {
    const styleVars = {
      ...getDimensionVars(dimension),
    };

    return (
      <div className="puck-dim" style={styleVars}>
        {form && <DyanamicForm form={form} />}
      </div>
    );
  },
};
