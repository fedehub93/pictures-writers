import { Editor, Element, Transforms } from "slate";

import { CustomEditor, CustomElementType } from "@/components/editor";
import { ReactEditor } from "slate-react";

type Format = "bold" | "italic" | "underline";

const LIST_TYPES = ["numbered-list", "bulleted-list"];
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
};
