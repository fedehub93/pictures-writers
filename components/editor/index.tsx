import React, { forwardRef, useMemo } from "react";
import { createEditor, BaseEditor, Descendant } from "slate";
import { Slate, withReact, ReactEditor } from "slate-react";

import Toolbar from "@/components/editor/toolbar";
import EditorInput, {
  withEmbeds,
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
  | "blockquote"
  | "link"
  | "code"
  | "list-item"
  | "unordered-list"
  | "numbered-list"
  | "image"
  | "video"
  | "affiliate-link"
  | "left"
  | "right"
  | "center";

export type EmbeddedImageElement = {
  type: "image";
  url: string;
  altText: string;
  children: EmptyText[];
};

export type EmbeddedVideoElement = {
  type: "video";
  url: string;
  children: EmptyText[];
};

export type EmbeddedAffiliateLinkElement = {
  type: "affiliate-link";
  url: string;
  label: string;
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
  withEmbeds(withInlines(withReact(createEditor())));

interface EditorComponent
  extends React.ForwardRefExoticComponent<
    EditorProps & React.RefAttributes<HTMLDivElement>
  > {
  Input: typeof EditorInput;
  Toolbar: typeof Toolbar;
  Counter: typeof Counter;
}

const Editor = forwardRef<HTMLDivElement, EditorProps>(
  ({ children, value, onChange, onValueChange }, ref) => {
    const editor = useMemo(() => createWrappedEditor(), []);

    return (
      <div ref={ref}>
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
      </div>
    );
  }
) as EditorComponent;

Editor.Input = EditorInput;
Editor.Toolbar = Toolbar;
Editor.Counter = Counter;

export default Editor;
