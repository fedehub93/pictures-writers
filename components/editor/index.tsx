import { createEditor, BaseEditor, Descendant } from "slate";
import { Slate, withReact, ReactEditor } from "slate-react";
import EditorInput from "@/components/editor/editor-input";
import Toolbar from "./toolbar";

export type CustomEditor = BaseEditor & ReactEditor;

export type CustomElementType =
  | "paragraph"
  | "heading-one"
  | "heading-two"
  | "heading-three"
  | "heading-four"
  | "block-quote"
  | "link"
  | "code"
  | "list-item"
  | "bulleted-list"
  | "numbered-list"
  | "left"
  | "center"
  | "right";

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  type?: "link";
};

export type CustomElement = {
  type: CustomElementType;
  children: CustomText[];
  url?: string;
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

// PLUGIN
const withInlines = (editor: CustomEditor) => {
  const { isInline } = editor;

  editor.isInline = (element) =>
    element.type === "link" ? true : isInline(element);

  return editor;
};

export const createWrappedEditor = () => withInlines(withReact(createEditor()));

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
