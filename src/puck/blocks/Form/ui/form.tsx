import DynamicForm from "@/shared/components/form-component/dynamic-form";
import { FormProps } from "@/puck/fields/form";

export const FormBlockUi = ({
  form,
  styleVars,
}: {
  form?: FormProps;
  styleVars: Record<string, string>;
}) => {
  return (
    <div className="puck-dim" style={styleVars}>
      {form && <DynamicForm form={form} />}
    </div>
  );
};
