import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/shared/ui/form";

import { GenericInput } from "@/shared/components/form-component/generic-input";

import type { FormDisplayInstance } from "../../../types/core";
import { useDesigner } from "../../../store/designer-provider";

import { PropertiesFormSchemaType, propertiesSchema } from "./schemas";

export const ButtonPropertiesComponent = ({
  elementInstance,
}: {
  elementInstance: FormDisplayInstance<"Button">;
}) => {
  const { updateNodeProperties } = useDesigner((state) => state);
  const { label } = elementInstance.properties;

  const form = useForm<PropertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    values: { label },
  });

  const onApplyChanges = (values: PropertiesFormSchemaType) => {
    updateNodeProperties(elementInstance.id, values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        onBlur={form.handleSubmit(onApplyChanges)}
        className="space-y-3"
      >
        <GenericInput control={form.control} label="Label" name="label" />
      </form>
    </Form>
  );
};
