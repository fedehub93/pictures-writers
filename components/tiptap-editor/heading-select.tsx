import { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const HeadingSelect = ({ editor }: { editor: Editor }) => {
  const [heading, setHeading] = useState("paragraph");

  useEffect(() => {
    if (!editor) return;

    const updateHeading = () => {
      if (editor.isActive("heading", { level: 1 })) return setHeading("h1");
      if (editor.isActive("heading", { level: 2 })) return setHeading("h2");
      if (editor.isActive("heading", { level: 3 })) return setHeading("h3");
      if (editor.isActive("paragraph")) return setHeading("paragraph");
      return setHeading(""); // fallback
    };

    updateHeading();

    editor.on("selectionUpdate", updateHeading);
    editor.on("transaction", updateHeading);

    return () => {
      editor.off("selectionUpdate", updateHeading);
      editor.off("transaction", updateHeading);
    };
  }, [editor]);

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

    setHeading(value);
  };

  return (
    <Select value={heading} onValueChange={handleChange}>
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
