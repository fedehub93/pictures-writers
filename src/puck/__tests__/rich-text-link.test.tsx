// @vitest-environment happy-dom
import type { Extensions, JSONContent } from "@tiptap/core";
import { Editor, generateHTML, generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";

import { renderComponentConfigs } from "../render-config";
import { RichTextField } from "../fields/rich-text";
import {
  RICH_TEXT_LINK_PROTOCOLS,
  RichTextLinkMark,
  isSafeRichTextHref,
} from "../fields/rich-text/link";

type RichTextFieldShape = {
  options?: { link?: unknown };
  tiptap?: { extensions?: Extensions };
};

const editorField = RichTextField as RichTextFieldShape;
const headingField = renderComponentConfigs.Heading?.fields?.text as
  | RichTextFieldShape
  | undefined;

const baseExtensions = StarterKit.configure({ link: false });

const withBase = (declared?: Extensions): Extensions => [
  baseExtensions,
  ...(declared ?? []),
];

const linkedParagraph = (attrs: Record<string, unknown>): JSONContent => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Scopri il Laboratorio →",
          marks: [{ type: "link", attrs }],
        },
      ],
    },
  ],
});

const editors: Editor[] = [];

const makeEditor = (extensions: Extensions, content: JSONContent | string) => {
  const editor = new Editor({ extensions, content });
  editors.push(editor);
  return editor;
};

afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
});

describe("Puck rich text link mark", () => {
  it("registers the same link mark in the editor field and the Heading render config", () => {
    expect(editorField.options?.link).toBe(false);
    expect(headingField?.options).toEqual(editorField.options);

    // The public config reuses the editor descriptor, so the two cannot drift.
    expect(headingField?.tiptap).toBe(editorField.tiptap);

    const editorLinks = (editorField.tiptap?.extensions ?? []).filter(
      (extension) => extension.name === RichTextLinkMark.name,
    );
    const publicLinks = (headingField?.tiptap?.extensions ?? []).filter(
      (extension) => extension.name === RichTextLinkMark.name,
    );

    expect(editorLinks).toHaveLength(1);
    expect(publicLinks).toHaveLength(1);
    expect(editorLinks[0]).toBe(RichTextLinkMark);
    expect(publicLinks[0]).toBe(RichTextLinkMark);
  });

  it("registers the safe protocols and does not guess target or rel", () => {
    expect(RichTextLinkMark.options.protocols).toEqual([
      ...RICH_TEXT_LINK_PROTOCOLS,
    ]);
    expect(isSafeRichTextHref("https://example.com")).toBe(true);
    expect(isSafeRichTextHref("mailto:hello@example.com")).toBe(true);
    expect(isSafeRichTextHref("/blog/")).toBe(true);
    expect(isSafeRichTextHref("ftp://example.com/file")).toBe(false);
    expect(RichTextLinkMark.options.HTMLAttributes).toEqual({
      target: null,
      rel: null,
      class: null,
    });
  });

  it("round-trips a link mark without adding target or rel", () => {
    const extensions = withBase(editorField.tiptap?.extensions);
    const editor = makeEditor(
      extensions,
      linkedParagraph({ href: "https://example.com/lab" }),
    );

    const json = editor.getJSON();
    const mark = json.content?.[0]?.content?.[0]?.marks?.[0];

    expect(mark).toMatchObject({
      type: "link",
      attrs: { href: "https://example.com/lab" },
    });
    expect(mark?.attrs?.target ?? null).toBeNull();
    expect(mark?.attrs?.rel ?? null).toBeNull();

    const html = generateHTML(json, extensions);
    expect(html).toContain('<a href="https://example.com/lab">');
    expect(html).not.toContain("target=");
    expect(html).not.toContain("rel=");
  });

  it("renders a Heading link identically from the editor and public configs", () => {
    const doc = linkedParagraph({ href: "https://example.com/lab" });

    const editorHtml = generateHTML(
      doc,
      withBase(editorField.tiptap?.extensions),
    );
    const publicHtml = generateHTML(
      doc,
      withBase(headingField?.tiptap?.extensions),
    );

    expect(publicHtml).toBe(editorHtml);
    expect(editorHtml).toContain(
      '<a href="https://example.com/lab">Scopri il Laboratorio →</a>',
    );
  });

  it("keeps target and rel when they were authored", () => {
    const html = generateHTML(
      linkedParagraph({
        href: "https://example.com/lab",
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      withBase(editorField.tiptap?.extensions),
    );

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("sets, edits and removes a link through the editor commands", () => {
    const extensions = withBase(editorField.tiptap?.extensions);
    const editor = makeEditor(extensions, {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Scopri" }] },
      ],
    });
    editor.commands.setTextSelection({ from: 1, to: 7 });

    expect(
      editor
        .chain()
        .focus()
        .setLink({ href: "https://example.com/lab" })
        .run(),
    ).toBe(true);
    expect(editor.getAttributes("link").href).toBe("https://example.com/lab");

    expect(
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: "https://example.org/altro" })
        .run(),
    ).toBe(true);
    expect(editor.getAttributes("link").href).toBe(
      "https://example.org/altro",
    );

    expect(
      editor.chain().focus().extendMarkRange("link").unsetLink().run(),
    ).toBe(true);
    expect(editor.isActive("link")).toBe(false);
    expect(
      JSON.stringify(editor.getJSON()),
    ).not.toContain('"link"');
  });

  it("does not turn a disallowed protocol into an anchor", () => {
    const extensions = withBase(editorField.tiptap?.extensions);

    for (const href of [
      "javascript:alert(1)",
      "data:text/html,<p>x</p>",
      "ftp://example.com/file",
    ]) {
      const parsed = generateJSON(
        `<p><a href="${href}">Click</a></p>`,
        extensions,
      );

      expect(JSON.stringify(parsed), href).not.toContain('"link"');
      expect(generateHTML(parsed, extensions), href).not.toContain("<a");
    }

    // A mark that already sits in stored JSON must not render as an anchor.
    const stored = generateHTML(
      linkedParagraph({ href: "javascript:alert(1)" }),
      extensions,
    );
    expect(stored).not.toContain("<a");
    expect(stored).toContain("Scopri il Laboratorio →");

    const editor = makeEditor(extensions, {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Click" }] },
      ],
    });
    editor.commands.setTextSelection({ from: 1, to: 6 });

    expect(editor.can().setLink({ href: "javascript:alert(1)" })).toBe(false);
    expect(editor.can().setLink({ href: "ftp://example.com" })).toBe(false);
  });
});
