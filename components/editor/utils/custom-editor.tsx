import { ReactEditor } from "slate-react";
import { Editor, Element, Path, Range, Transforms } from "slate";

import isUrl from "is-url";
import imageExtensions from "image-extensions";

import {
  CustomEditor,
  CustomElement,
  CustomElementType,
  EmbeddedAffiliateLinkElement,
  EmbeddedImageElement,
  EmbeddedProductElement,
  EmbeddedVideoElement,
} from "@/components/editor";
import { db } from "@/lib/db";
import { ProductCategory } from "@prisma/client";

type Format = "bold" | "italic" | "underline";

const LIST_TYPES = ["ordered-list", "unordered-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];
// Define our own custom set of helpers.
export const CustomEditorHelper = {
  isBlockActive(
    editor: CustomEditor,
    format: CustomElementType,
    blockType: "align" | "type" = "type"
  ) {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: (n) =>
          !Editor.isEditor(n) &&
          Element.isElement(n) &&
          n[blockType] === format,
      })
    );

    return !!match;
  },

  toggleBlock(editor: CustomEditor, format: CustomElementType) {
    const isActive = CustomEditorHelper.isBlockActive(
      editor,
      format,
      TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
    );
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        LIST_TYPES.includes(n.type) &&
        !TEXT_ALIGN_TYPES.includes(format),
      split: true,
    });
    let newProperties: Partial<Element>;
    if (TEXT_ALIGN_TYPES.includes(format)) {
      newProperties = {
        align: isActive ? undefined : format,
      };
    } else {
      newProperties = {
        type: isActive ? "paragraph" : isList ? "list-item" : format,
      };
    }
    Transforms.setNodes<Element>(editor, newProperties);

    if (!isActive && isList) {
      const block = { type: format, children: [] };
      Transforms.wrapNodes(editor, block);
    }

    ReactEditor.focus(editor);
  },

  isMarkActive(editor: CustomEditor, format: Format) {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  },

  toggleMark(editor: CustomEditor, format: Format) {
    const isActive = CustomEditorHelper.isMarkActive(editor, format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
    ReactEditor.focus(editor);
  },
  isLink(editor: CustomEditor) {
    const [link] = Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n.type === "hyperlink",
    });
    return !!link;
  },
  wrapLink(editor: CustomEditor, url: string, text: string) {
    if (!url) return;
    const { selection } = editor;

    const link: CustomElement = {
      type: "hyperlink",
      data: {
        uri: url,
      },
      children: [{ text }],
    };

    ReactEditor.focus(editor);

    if (!!selection) {
      const [parentNode, parentPath] = Editor.parent(
        editor,
        selection.focus?.path
      );

      // Remove the Link node if we're inserting a new link node inside of another
      // link.
      if (Element.isElement(parentNode)) {
        if (parentNode.type === "hyperlink") {
          CustomEditorHelper.unwrapLink(editor);
        }

        if (editor.isVoid(parentNode)) {
          // Insert the new link after the void node
          Transforms.insertNodes(
            editor,
            { type: "paragraph", children: [{ text: "" }] },
            { at: Path.next(parentPath), select: true }
          );
        } else if (Range.isCollapsed(selection)) {
          // Insert the new link in our last known location
          Transforms.insertNodes(editor, link, { select: true });
        } else {
          // Wrap the currently selected range of text into a Link
          Transforms.wrapNodes(editor, link, { split: true });
          // Remove the highlight and move the cursor to the end of the highlight
          Transforms.collapse(editor, { edge: "end" });
        }
      }
    } else {
      // Insert the new link node at the bottom of the Editor when selection
      // is falsey
      Transforms.insertNodes(editor, link);
    }
  },
  unwrapLink(editor: CustomEditor) {
    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n.type === "hyperlink",
    });
  },
  insertImage(editor: CustomEditor, url: string, altText: string) {
    const text = { text: "" };
    const image: EmbeddedImageElement = {
      type: "image",
      url,
      altText,
      children: [text],
    };
    Transforms.insertNodes(editor, image);
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    });
  },
  isImageUrl(url: string) {
    if (!url) return false;
    if (!isUrl(url)) return false;
    const ext = new URL(url).pathname.split(".").pop() || "";
    return imageExtensions.includes(ext);
  },
  insertVideo(editor: CustomEditor, url: string) {
    const text = { text: "" };
    const video: EmbeddedVideoElement = {
      type: "video",
      data: {
        uri: url,
      },
      children: [text],
    };
    Transforms.insertNodes(editor, video);
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    });
  },
  insertAffiliateLink(editor: CustomEditor, url: string, label: string) {
    const text = { text: "" };
    const affiliateLink: EmbeddedAffiliateLinkElement = {
      type: "affiliate-link",
      data: { uri: url, label },
      children: [text],
    };
    Transforms.insertNodes(editor, affiliateLink);
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    });
  },
  insertSponsorFirstImpression(editor: CustomEditor) {
    const text = { text: "" };
    const sponsor: any = {
      type: "sponsor-first-impression",
      children: [text],
    };
    Transforms.insertNodes(editor, sponsor);
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    });
  },
  async insertProduct(editor: CustomEditor, data: any) {
    const text = { text: "" };

    const product: EmbeddedProductElement = {
      type: "product",
      data: {
        title: data?.title || "",
        type: data?.category || "AFFILIATE",
        slug: data?.slug || "",
        imageCoverUrl: data?.imageCover?.url || "",
        price: data?.price,
        discountedPrice: data?.discountedPrice,
        metadata: {
          ...data.metadata,
        },
      },
      children: [text],
    };
    Transforms.insertNodes(editor, product);
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    });
  },
};
