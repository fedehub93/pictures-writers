import { Editor, useEditorState } from "@tiptap/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const HeadingSelect = ({ editor }: { editor: Editor }) => {
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) {
        return { heading: "paragraph" as "paragraph" | "h1" | "h2" | "h3" };
      }

      if (e.isActive("heading", { level: 1 })) return { heading: "h1" };
      if (e.isActive("heading", { level: 2 })) return { heading: "h2" };
      if (e.isActive("heading", { level: 3 })) return { heading: "h3" };
      return { heading: "paragraph" };
    },
  });

  const handleChange = (value: string) => {
    switch (value) {
      case "paragraph":
        editor.chain().focus().setParagraph().run();
        break;
      case "h1":
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case "h2":
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case "h3":
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
    }
    setTimeout(() => {
      editor.chain().focus().run();
    }, 1);
  };

  return (
    <Select value={editorState.heading} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Heading" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="paragraph">Paragrafo</SelectItem>
        <SelectItem value="h1">Heading 1</SelectItem>
        <SelectItem value="h2">Heading 2</SelectItem>
        <SelectItem value="h3">Heading 3</SelectItem>
      </SelectContent>
    </Select>
  );
};
