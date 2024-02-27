import React, { useMemo } from "react";
import { createEditor, BaseEditor, Descendant } from "slate";
import { Slate, withReact, ReactEditor } from "slate-react";
import { ControllerRenderProps } from "react-hook-form";

import Toolbar from "@/components/editor/toolbar";
import EditorInput, { withInlines } from "@/components/editor/editor-input";

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
  | "right"
  | "center";

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type CustomElement = {
  type: CustomElementType;
  children: Descendant[];
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
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
}

const createWrappedEditor = () => withInlines(withReact(createEditor()));

const Editor = ({ value, onChange }: EditorProps) => {
  const editor = useMemo(() => createWrappedEditor(), []);

  return (
    <Slate editor={editor} initialValue={value} onChange={onChange}>
      <Toolbar />
      <EditorInput />
    </Slate>
  );
};

Editor.displayName = "Editor";

export default Editor;
