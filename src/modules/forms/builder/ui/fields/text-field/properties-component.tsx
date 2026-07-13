import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/shared/ui/form";
import { GenericInput } from "@/shared/components/form-component/generic-input";

import { type FormElementInstance } from "../../../types";
import { useDesigner } from "../../../store/use-designer-store";

import { PropertiesFormSchemaType, propertiesSchema } from "./schemas";

export const TextFieldPropertiesForm = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"TextField">;
}) => {
  const { updateNodeProperties } = useDesigner();

  const { label, placeholder, helperText } = elementInstance.properties;
  const form = useForm<PropertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    defaultValues: {
      label,
      helperText,
      placeholder,
    },
  });

  useEffect(() => {
    form.reset(elementInstance.properties);
  }, [elementInstance, form]);

  const onApplyChanges = (values: PropertiesFormSchemaType) => {
    updateNodeProperties(elementInstance.id, values);
  };

  return (
    <Form {...form}>
      <form onBlur={form.handleSubmit(onApplyChanges)} className="space-y-3">
        <GenericInput
          control={form.control}
          label="Label"
          name="label"
          description="The label of the field."
        />
        <GenericInput
          control={form.control}
          label="Placeholder"
          name="placeholder"
          description="The placeholder of the field."
        />
        <GenericInput
          control={form.control}
          label="Helper text"
          name="helperText"
          description="The helper text of the field."
        />
      </form>
    </Form>
  );
};
