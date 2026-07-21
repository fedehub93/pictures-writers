import { PlusIcon, XIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

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
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CustomLink } from "@/shared/components/tiptap-editor/extensions/link";
import { cn } from "@/shared/lib/utils";
import { useEffect } from "react";
import { MenuBar } from "../../../tiptap/menu-bar";

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      CustomLink.configure({ openOnClick: false }),
    ],
    content: description,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(`!outline-0`),
      },
    },
    onUpdate: ({ editor }) => {
      form.setValue("description", editor.getJSON(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    onBlur: () => {
      form.handleSubmit(onApplyChanges)();
    },
  });

  useEffect(() => {
    if (editor && description) {
      const currentEditorContent = editor.getJSON();
      if (
        JSON.stringify(currentEditorContent) !== JSON.stringify(description)
      ) {
        editor.commands.setContent(description);
      }
    }
  }, [editor, description]);

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

        <div className="border rounded">
          <MenuBar editor={editor} />
          <div className="px-4 py-4">
            <EditorContent editor={editor} />
          </div>
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
