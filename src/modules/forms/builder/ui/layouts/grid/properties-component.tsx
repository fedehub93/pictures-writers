import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/shared/ui/form";
import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericNumber } from "@/shared/components/form-component/generic-number";

import type { FormLayoutInstance } from "../../../types/core";

import { PropertiesFormSchemaType, propertiesSchema } from "./schemas";
import { useDesigner } from "../../../store/designer-provider";

export const GridPropertiesComponent = ({
  elementInstance,
}: {
  elementInstance: FormLayoutInstance<"Grid">;
}) => {
  const { id, properties } = elementInstance;

  const { updateNodeProperties } = useDesigner((state) => state);

  const form = useForm<PropertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    defaultValues: {
      ...properties,
    },
  });

  useEffect(() => {
    form.reset(elementInstance.properties);
  }, [elementInstance, form]);

  const onApplyChanges = (values: PropertiesFormSchemaType) => {
    updateNodeProperties(id, values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        onBlur={form.handleSubmit(onApplyChanges)}
        className="space-y-3"
      >
        <GenericInput control={form.control} label="Label" name="label" />
        <div className="flex justify-between gap-x-8">
          <GenericNumber
            control={form.control}
            name="columns"
            label="Columns"
            placeholder="0"
            onChange={() => {
              form.handleSubmit(onApplyChanges)();
            }}
          />
          <GenericNumber
            control={form.control}
            name="gap"
            label="Gap"
            placeholder="0"
            onChange={() => form.handleSubmit(onApplyChanges)()}
          />
        </div>
      </form>
    </Form>
  );
};
