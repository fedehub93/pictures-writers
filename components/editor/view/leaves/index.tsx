import { Fragment, ReactNode } from "react";
import { Text } from "slate";
import { createLeafNodeMatcher, createLeafTransform } from "slate-to-react";

export interface RichText extends Text {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export const isRichText = createLeafNodeMatcher<RichText>(
  (node): node is RichText => {
    return typeof node.text === "string";
  }
);

export const RichText = createLeafTransform(
  isRichText,

  ({ key, attributes, leaf, children }) => {
    // Render <br /> for empty text blocks as it's probably just an empty line
    // if (!children) {
    //   return <br key={key} />;
    // }

    let element: ReactNode = children;

    if (leaf.bold) {
      element = <strong key={key}>{element}</strong>;
    }

    if (leaf.italic) {
      element = <i key={key}>{element}</i>;
    }

    if (leaf.underline) {
      element = <u key={key}>{element}</u>;
    }

    return <Fragment key={key}>{element}</Fragment>;
  }
);
