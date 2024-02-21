import { createEditor, BaseEditor, Descendant } from "slate";
import { Slate, withReact, ReactEditor } from "slate-react";
import EditorInput from "@/components/editor/editor-input";
import Toolbar from "./toolbar";

export type CustomEditor = BaseEditor & ReactEditor;

export type CustomElementType =
  | "paragraph"
  | "code"
  | "list-item"
  | "left"
  | "center"
  | "right"
  | "bold"
  | "italic"
  | "underline";

export type CustomText = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  left?: boolean;
  center?: boolean;
  right?: boolean;
  text: string;
};

type CustomElement = {
  type: CustomElementType;
  children: CustomText[];
  href?: string;
  align?: string;
};

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface EditorProps {
  editor: CustomEditor;
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
