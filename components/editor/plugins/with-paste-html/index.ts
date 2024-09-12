import { Descendant, Transforms } from "slate";
import { jsx } from "slate-hyperscript";
import { CustomEditor, CustomElement, CustomText } from "../../index";

// Definizione dei tipi per gli attributi degli elementi
interface ElementAttributes {
  type?: string;
  url?: string;
  code?: boolean;
  strikethrough?: boolean;
  italic?: boolean;
  bold?: boolean;
  underline?: boolean;
}

// Funzioni per deserializzare gli elementi HTML in nodi Slate
const ELEMENT_TAGS: Record<string, (el: HTMLElement) => ElementAttributes> = {
  A: (el) => ({
    type: "hyperlink",
    data: { uri: el.getAttribute("href") || "" },
  }),
  BLOCKQUOTE: () => ({ type: "blockquote" }),
  H1: () => ({ type: "heading-1" }),
  H2: () => ({ type: "heading-2" }),
  H3: () => ({ type: "heading-3" }),
  H4: () => ({ type: "heading-4" }),
  H5: () => ({ type: "heading-5" }),
  H6: () => ({ type: "heading-6" }),
  IMG: (el) => ({ type: "image", url: el.getAttribute("src") || "" }),
  LI: () => ({ type: "list-item" }),
  OL: () => ({ type: "ordered-list" }),
  P: () => ({ type: "paragraph" }),
  PRE: () => ({ type: "code" }),
  UL: () => ({ type: "unordered-list" }),
};

const TEXT_TAGS: Record<string, () => ElementAttributes> = {
  CODE: () => ({ code: true }),
  DEL: () => ({ strikethrough: true }),
  EM: () => ({ italic: true }),
  I: () => ({ italic: true }),
  S: () => ({ strikethrough: true }),
  STRONG: () => ({ bold: true }),
  U: () => ({ underline: true }),
};

// Funzione per deserializzare un nodo HTML in nodi Slate
const deserialize = (el: any): any => {
  if (el.nodeType === 3) {
    return el.textContent;
  } else if (el.nodeType !== 1) {
    return null;
  } else if (el.nodeName === "BR") {
    return "\n";
  }

  const { nodeName } = el;
  let parent = el;

  if (
    nodeName === "PRE" &&
    el.childNodes[0] &&
    el.childNodes[0].nodeName === "CODE"
  ) {
    parent = el.childNodes[0];
  }
  let children = Array.from(parent.childNodes).map(deserialize).flat();

  if (children.length === 0) {
    children = [{ text: "" }];
  }

  if (el.nodeName === "BODY") {
    return jsx("fragment", {}, children);
  }

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](el);
    return jsx("element", attrs, children);
  }

  if (TEXT_TAGS[nodeName]) {
    const attrs = TEXT_TAGS[nodeName]();
    return children.map((child) => jsx("text", attrs, child));
  }

  return children;
};

const withPasteHandler = (editor: CustomEditor) => {
  const { insertData } = editor;

  editor.insertData = (data) => {
    const html = data.getData("text/html");

    if (html) {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const fragment = deserialize(parsed.body);
      Transforms.insertFragment(editor, fragment);
      return;
    }

    insertData(data);
  };

  return editor;
};

export default withPasteHandler;
