import React, { useMemo } from "react";
import { createEditor, BaseEditor, Descendant } from "slate";
import { Slate, withReact, ReactEditor } from "slate-react";

import Toolbar from "@/components/editor/toolbar";
import EditorInput, {
  withImages,
  withInlines,
} from "@/components/editor/editor-input";
import { Counter } from "./counter";

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
  | "image"
  | "left"
  | "right"
  | "center";

export type EmbeddedImageElement = {
  type: "image";
  url: string;
  altText: string;
  children: EmptyText[];
};

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type EmptyText = {
  text: string;
};

export type CustomElement = {
  type: string;
  children: Array<CustomElement | CustomText>;
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
  children: React.ReactNode;
  value: Descendant[];
  onChange?: (value: Descendant[]) => void;
  onValueChange?: (value: Descendant[]) => void;
}

const createWrappedEditor = () =>
  withImages(withInlines(withReact(createEditor())));

const Editor = ({ children, value, onChange, onValueChange }: EditorProps) => {
  const editor = useMemo(() => createWrappedEditor(), []);

  return (
    <Slate
      editor={editor}
      initialValue={value}
      onChange={onChange}
      onValueChange={onValueChange}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child);
      })}
    </Slate>
  );
};

Editor.Input = EditorInput;
Editor.Toolbar = Toolbar;
Editor.Counter = Counter;

export default Editor;
