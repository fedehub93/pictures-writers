import "server-only";

import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";

import { TiptapContent } from "@/types";

import { tiptapContentExtensions } from "../extensions";

export const renderTiptapHtml = (content: TiptapContent): string => {
  if (!content || typeof content === "string") return "";

  return renderToHTMLString({
    content,
    extensions: tiptapContentExtensions,
  });
};