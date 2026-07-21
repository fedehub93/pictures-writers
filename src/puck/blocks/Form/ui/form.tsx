import DynamicForm from "@/shared/components/form-component/dynamic-form";
import type { HydratedFormProps } from "@/puck/fields/form";
import { FormRunner } from "@/modules/forms/builder/runner/form-runner";

export const FormBlockUi = ({
  form,
  styleVars,
}: {
  form?: HydratedFormProps;
  styleVars: Record<string, string>;
}) => {
  console.log(form)
  if (!form || !form.content)
    return (
      <div className="flex items-center justify-center size-full">
        Select a valid form!
      </div>
    );
  return (
    <div className="puck-dim" style={styleVars}>
      {/* {form && <DynamicForm form={form} />} */}

      <FormRunner
        id={form.id}
        gtmEventName={form.gtmEventName}
        content={form.content}
      />
    </div>
  );
};
