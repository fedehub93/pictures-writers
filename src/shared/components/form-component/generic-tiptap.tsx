import { Control, FieldValues, Path, useController } from "react-hook-form";
import { useEditor } from "@tiptap/react";

import { FormControl, FormField, FormItem, FormLabel } from "@/shared/ui/form";

import Tiptap from "../tiptap-editor";
import { createProductionExtensions } from "../tiptap-editor/lib/create-editor-extensions";

interface GenericTiptapProps<T extends FieldValues> {
  id: string;
  control: Control<T>;
  name: Path<T>;
  onUpdate?: () => void;
  toolbar?: boolean;
}

export const GenericTiptap = <T extends FieldValues>({
  id,
  control,
  name,
  onUpdate,
  toolbar = true,
}: GenericTiptapProps<T>) => {
  const { field } = useController({ control, name });
  const editor = useEditor({
    extensions: createProductionExtensions(),
    content: field.value ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "!outline-0",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      queueMicrotask(() => {
        field.onChange(json);
        if (onUpdate) onUpdate();
      });
    },
  });

  return (
    <div className="flex flex-col space-y-2">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex-1 flex flex-col space-y-2">
            <FormLabel>Description</FormLabel>
            <FormControl>
              <div className="border-l border-r border-b rounded-xl overflow-hidden">
                <Tiptap
                  key={id}
                  editor={editor}
                  value={field.value}
                  toolbar={toolbar}
                />
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};
