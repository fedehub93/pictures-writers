import { createEditor, BaseEditor, Descendant, Transforms } from "slate";
import { Slate, withReact, ReactEditor } from "slate-react";
import EditorInput from "@/components/editor/editor-input";
import Toolbar from "./toolbar";
import { ControllerRenderProps } from "react-hook-form";

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

interface EditorProps extends ControllerRenderProps {
  editor: CustomEditor;
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
}

const Editor = ({ editor, value, onChange }: EditorProps) => {
  return (
    <Slate editor={editor} initialValue={value} onChange={onChange}>
      <Toolbar />
      <EditorInput />
    </Slate>
  );
};

export default Editor;
