// @vitest-environment happy-dom
import type { Extensions } from "@tiptap/core";
import { Editor, generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";

import type { RichTextFieldDescriptor } from "../fields/rich-text/presets";
import {
  RICH_TEXT_PLACEHOLDERS,
  richTextDescriptors,
} from "../fields/rich-text/presets";

/**
 * Mount a real Tiptap editor with a block's declared extensions, the way
 * Puck's canvas does, so the placeholder decoration is exercised rather than
 * only inspected.
 */
const extensionsOf = (descriptor: RichTextFieldDescriptor): Extensions => [
  StarterKit.configure({ link: false }),
  ...(descriptor.tiptap?.extensions ?? []),
];

const editors: Editor[] = [];

const makeEditor = (
  descriptor: RichTextFieldDescriptor,
  content = "",
): Editor => {
  const editor = new Editor({ extensions: extensionsOf(descriptor), content });
  editors.push(editor);
  return editor;
};

afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
});

const BLOCKS = [
  {
    name: "Heading",
    descriptor: richTextDescriptors.heading,
    hint: RICH_TEXT_PLACEHOLDERS.heading,
  },
  {
    name: "Text",
    descriptor: richTextDescriptors.text,
    hint: RICH_TEXT_PLACEHOLDERS.text,
  },
];

describe("empty block placeholder", () => {
  it.each(BLOCKS)(
    "decorates an empty $name with its own hint",
    ({ descriptor, hint }) => {
      const editor = makeEditor(descriptor);
      const paragraph = editor.view.dom.querySelector("p");

      expect(paragraph?.classList.contains("is-empty")).toBe(true);
      expect(paragraph?.getAttribute("data-placeholder")).toBe(hint);
    },
  );

  it.each(BLOCKS)(
    "keeps the $name hint out of the serialized document",
    ({ descriptor }) => {
      const editor = makeEditor(descriptor);
      const html = generateHTML(editor.getJSON(), extensionsOf(descriptor));

      expect(html).not.toContain(RICH_TEXT_PLACEHOLDERS.heading);
      expect(html).not.toContain(RICH_TEXT_PLACEHOLDERS.text);
      expect(html).not.toContain("data-placeholder");
      expect(html).not.toContain("is-empty");
    },
  );
});
