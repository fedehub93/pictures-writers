import { memo } from "react";
import { useForm, Controller } from "react-hook-form";
import slugify from "slugify";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { CustomLink } from "@/shared/components/tiptap-editor/extensions/link";
import { cn } from "@/shared/lib/utils";

import { Form } from "@/shared/ui/form";
import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericSwitch } from "@/shared/components/form-component/generic-switch";

import type { FormElementInstance } from "../../../types/core";
import { useDesigner } from "../../../store/designer-provider";
import { MenuBar } from "../../../tiptap/menu-bar";

import { PropertiesFormSchemaType, propertiesSchema } from "./schemas";

const DescriptionEditor = memo(
  ({
    initialContent,
    onChange,
    onBlur,
  }: {
    initialContent: any;
    onChange: (content: any) => void;
    onBlur: () => void;
  }) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ link: false }),
        CustomLink.configure({ openOnClick: false }),
      ],
      content: initialContent,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: cn(`!outline-0`),
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getJSON());
      },
      onBlur,
    });

    return (
      <div className="border rounded">
        <MenuBar editor={editor} />
        <div className="px-4 py-4">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);

DescriptionEditor.displayName = "DescriptionEditor";

export const CheckboxFieldPropertiesComponent = ({
  elementInstance,
}: {
  elementInstance: FormElementInstance<"CheckboxField">;
}) => {
  const { updateNodeProperties } = useDesigner((state) => state);

  const { name, label, description, helperText, validation } =
    elementInstance.properties;

  const form = useForm<PropertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    values: {
      name,
      label,
      helperText,
      description,
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

        <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Description
        </p>

        <Controller
          control={form.control}
          name="description"
          render={({ field }) => (
            <DescriptionEditor
              key={elementInstance.id}
              initialContent={field.value}
              onChange={field.onChange}
              onBlur={() => {
                field.onBlur();
                form.handleSubmit(onApplyChanges)();
              }}
            />
          )}
        />

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
