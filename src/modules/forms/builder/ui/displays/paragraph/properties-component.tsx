import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Form } from "@/shared/ui/form";
import { cn } from "@/shared/lib/utils";

import { CustomLink } from "@/shared/components/tiptap-editor/extensions/link";

import type { FormDisplayInstance } from "../../../types/core";
import { useDesigner } from "../../../store/designer-provider";
import { MenuBar } from "../../../tiptap/menu-bar";

import { PropertiesFormSchemaType, propertiesSchema } from "./schemas";
import { GenericInput } from "@/shared/components/form-component/generic-input";

export const ParagraphPropertiesComponent = ({
  elementInstance,
}: {
  elementInstance: FormDisplayInstance<"Paragraph">;
}) => {
  const { updateNodeProperties } = useDesigner((state) => state);
  const { label, content } = elementInstance.properties;

  const form = useForm<PropertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    values: { label, content },
  });

  const onApplyChanges = (values: PropertiesFormSchemaType) => {
    updateNodeProperties(elementInstance.id, values);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      CustomLink.configure({ openOnClick: false }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(`!outline-0`),
      },
    },
    onUpdate: ({ editor }) => {
      form.setValue("content", editor.getJSON(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    onBlur: () => {
      form.handleSubmit(onApplyChanges)();
    },
  });

  useEffect(() => {
    if (editor && content) {
      const currentEditorContent = editor.getJSON();
      if (JSON.stringify(currentEditorContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
        <GenericInput control={form.control} label="Label" name="label" />
        <div className="border rounded">
          <MenuBar editor={editor} />
          <div className="px-4 pb-4">
            <EditorContent editor={editor} />
          </div>
        </div>
      </form>
    </Form>
  );
};
