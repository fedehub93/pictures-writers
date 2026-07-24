import { PlusIcon, XIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";

import { Form } from "@/shared/ui/form";
import { Separator } from "@/shared/ui/separator";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericSwitch } from "@/shared/components/form-component/generic-switch";

import type { FormElementInstance } from "../../../types/core";

import { useDesigner } from "../../../store/designer-provider";

import { PropertiesFormSchemaType, propertiesSchema } from "./schemas";

export const SelectFieldPropertiesComponent = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"SelectField">;
}) => {
  const { updateNodeProperties } = useDesigner((state) => state);

  const { name, label, placeholder, helperText, options, validation } =
    elementInstance.properties;

  const form = useForm<PropertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    values: {
      name,
      label,
      helperText,
      placeholder,
      options,
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
          label="Placeholder"
          name="placeholder"
        />
        <GenericInput
          control={form.control}
          label="Helper text"
          name="helperText"
        />
        {/* --- OPTIONS */}
        <Separator />
        <Controller
          control={form.control}
          name="options"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex justify-between items-center">
                <FieldLabel htmlFor="options">Options</FieldLabel>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    form.setValue("options", field.value.concat("New option"));
                  }}
                >
                  <PlusIcon />
                  Add
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {form.watch("options").map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-1"
                  >
                    <Input
                      placeholder=""
                      value={option}
                      onChange={(e) => {
                        field.value[index] = e.target.value;
                        field.onChange(field.value);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        const newOptions = [...field.value];
                        newOptions.splice(index, 1);
                        field.onChange(newOptions);
                      }}
                    >
                      <XIcon />
                    </Button>
                  </div>
                ))}
              </div>
            </Field>
          )}
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
