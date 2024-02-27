import {
  createEditor,
  BaseEditor,
  Descendant,
  Transforms,
  Editor as SlateEditor,
} from "slate";
import { Slate, withReact, ReactEditor } from "slate-react";
import EditorInput, {
  createWrappedEditor,
} from "@/components/editor/editor-input";
import Toolbar from "./toolbar";
import { ControllerRenderProps } from "react-hook-form";
import { forwardRef, useMemo } from "react";
import React from "react";

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
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
}

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
