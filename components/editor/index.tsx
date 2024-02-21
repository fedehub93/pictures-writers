import { createEditor, BaseEditor, Descendant } from "slate";
import { Slate, withReact, ReactEditor, Editable } from "slate-react";
import EditorInput from "@/components/editor/editor-input";
import Toolbar from "./toolbar";

type CustomElementType = "paragraph" | "code";

type CustomText = {
  attachmentId?: string;
  text: string;
};

type CustomElement = {
  type: CustomElementType;
  children: CustomText[];
  href?: string;
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface EditorProps {
  editor: BaseEditor & ReactEditor;
  initialValue?: Descendant[];
}

export const createWrappedEditor = () => withReact(createEditor());

const defaultInitialValue: Descendant[] = [
  { type: "paragraph", children: [{ text: "" }] },
];

const Editor = ({ editor, initialValue }: EditorProps) => {
  return (
    <Slate editor={editor} initialValue={initialValue || defaultInitialValue}>
      <Toolbar />
      <EditorInput />
    </Slate>
  );
};

export default Editor;
