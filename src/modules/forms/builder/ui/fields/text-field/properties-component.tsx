import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/shared/ui/form";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericSwitch } from "@/shared/components/form-component/generic-switch";
import { GenericNumber } from "@/shared/components/form-component/generic-number";

import type { FormElementInstance } from "../../../types";
import { useDesigner } from "../../../store/use-designer-store";

import { PropertiesFormSchemaType, propertiesSchema } from "./schemas";

export const TextFieldPropertiesForm = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"TextField">;
}) => {
  const { updateNodeProperties } = useDesigner();

  const { name, label, placeholder, helperText, validation } =
    elementInstance.properties;

  const form = useForm<PropertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    defaultValues: {
      name,
      label,
      helperText,
      placeholder,
      validation: {
        required: validation.required ?? false,
        minLength: validation.minLength,
        maxLength: validation.maxLength,
      },
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
      <form
        onSubmit={(e) => e.preventDefault()}
        onBlur={form.handleSubmit(onApplyChanges)}
        className="space-y-3"
      >
        <GenericInput control={form.control} label="Name" name="name" />
        <GenericInput control={form.control} label="Label" name="label" />
        <GenericInput
          control={form.control}
          label="Placeholder"
          name="placeholder"
        />
        <GenericInput
          control={form.control}
          label="Helper text"
          name="helperText"
        />
        {/* --- SEZIONE VALIDATORI --- */}
        <div className="pt-4 mt-4 border-t border-dashed">
          <h4 className="text-sm mb-3">Validation Rules</h4>

          <GenericSwitch
            control={form.control}
            name="validation.required"
            label="Required"
            onCheckedChange={() => form.handleSubmit(onApplyChanges)()}
          />

          <div className="flex gap-3 mt-3">
            <GenericNumber
              control={form.control}
              name="validation.minLength"
              label="Min. Length"
              placeholder="0"
            />

            <GenericNumber
              control={form.control}
              name="validation.maxLength"
              label="Max. Length"
              placeholder="e.g. 50"
            />
          </div>
        </div>
      </form>
    </Form>
  );
};
