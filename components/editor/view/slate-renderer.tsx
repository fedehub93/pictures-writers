"use client";

import { RenderNode } from "./helpers/render-node";

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

export const isCustomText = (
  element: CustomElement | CustomText
): element is CustomText => {
  return (element as CustomText).text !== undefined;
};

type Props = {
  content: CustomElement[];
};

const SlateRendererV2 = ({ content }: Props) => {
  return (
    <div className="post">
      {content.map((node, i) => (
        <RenderNode key={i} node={node} />
      ))}
    </div>
  );
};

export { SlateRendererV2 };
