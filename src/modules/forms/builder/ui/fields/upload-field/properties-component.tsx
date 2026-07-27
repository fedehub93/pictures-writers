import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";

import { Form } from "@/shared/ui/form";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericSwitch } from "@/shared/components/form-component/generic-switch";

import type { FormElementInstance } from "../../../types/core";

import { useDesigner } from "../../../store/designer-provider";
import { PropertiesFormSchemaType, propertiesSchema } from "./schemas";

export const UploadFieldPropertiesComponent = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"UploadField">;
}) => {
  const { updateNodeProperties } = useDesigner((state) => state);

  const { name, label, helperText, files, validation } =
    elementInstance.properties;

  const form = useForm<PropertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    values: {
      name,
      label,
      helperText,
      validation: {
        required: validation.required ?? false,
      },
    },
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
        <div className="flex gap-x-4">
          <GenericInput
            control={form.control}
            label="Label"
            name="label"
            onChange={(e) => {
              form.setValue(
                "name",
                slugify(e.target.value, {
                  replacement: "_",
                  remove: /[*+~.()'"!:@]/g,
                  lower: true,
                }),
                {
                  shouldValidate: true,
                  shouldDirty: true,
                },
              );
            }}
          />
          <GenericInput
            control={form.control}
            label="Name"
            name="name"
            disabled
          />
        </div>

        <GenericInput
          control={form.control}
          label="Helper text"
          name="helperText"
        />

        {/* --- SEZIONE VALIDATORI --- */}
        <div className="flex flex-col space-y-4 pt-4 mt-4 border-t border-dashed">
          <h4 className="text-sm mb-3">Validation Rules</h4>
          <GenericSwitch
            control={form.control}
            name="validation.required"
            label="Required"
            onCheckedChange={() => form.handleSubmit(onApplyChanges)()}
          />
        </div>
      </form>
    </Form>
  );
};
