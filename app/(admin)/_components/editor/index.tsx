import React, { forwardRef, useMemo } from "react";
import { createEditor, BaseEditor, Descendant } from "slate";
import { Slate, withReact, ReactEditor } from "slate-react";
import { withHistory } from "slate-history";

import EditorInput from "./editor-input";
import { Counter } from "./helpers/counter";
import withNormalization from "./plugins/with-normalization";
import withInline from "./plugins/with-inline";
import withEmbeds from "./plugins/with-embeds";
import withPasteHandler from "./plugins/with-paste-html";
import { ProductType } from "@prisma/client";
import { AffiliateMetadata, EbookMetadata } from "@/types";
import Toolbar from "./toolbar";

export type CustomEditor = BaseEditor & ReactEditor;

export type CustomElementType =
  | "paragraph"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "heading-4"
  | "blockquote"
  | "info-box"
  | "hyperlink"
  | "code"
  | "list-item"
  | "unordered-list"
  | "ordered-list"
  | "image"
  | "video"
  | "affiliate-link"
  | "product"
  | "sponsor-first-impression"
  | "left"
  | "right"
  | "center";

export type InfoBoxElement = {
  type: "info-box";
  data: { icon: string };
  children: CustomElement[];
};

export type EmbeddedProductElement = {
  type: "product";
  data: {
    title: string;
    type: ProductType;
    slug: string;
    imageCoverUrl: string;
    price: number;
    discountedPrice: number;
    metadata?: EbookMetadata | AffiliateMetadata | null;
  };
  children: EmptyText[];
};

export type EmbeddedImageElement = {
  type: "image";
  url: string;
  altText: string;
  children: EmptyText[];
};

export type EmbeddedVideoElement = {
  type: "video";
  data: { uri: string };
  children: EmptyText[];
};

export type EmbeddedAffiliateLinkElement = {
  type: "affiliate-link";
  data: { uri: string; label: string };
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
  data?: any;
  url?: string;
  align?: string;
  altText?: string;
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

export const isCustomText = (
  element: CustomElement | CustomText
): element is CustomText => {
  return (element as CustomText).text !== undefined;
};

const createWrappedEditor = () =>
  withPasteHandler(
    withEmbeds(
      withNormalization(withInline(withHistory(withReact(createEditor()))))
    )
  );

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

Editor.displayName = "Editor";
Editor.Input = EditorInput;
Editor.Toolbar = Toolbar;
Editor.Counter = Counter;

export default Editor;
