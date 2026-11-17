// @vitest-environment happy-dom
import type { Editor } from "@tiptap/core";
import { Editor as TiptapEditor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { getRichTextMenuPortalContainer } from "../fields/rich-text";
import { richTextExtensions } from "../fields/rich-text/extensions";
import { ColorPickerPopover } from "../fields/rich-text/ui/components/color-picker-popover";
import { LinkPickerPopover } from "../fields/rich-text/ui/components/link-picker-popover";

/**
 * The link and colour panels open inside the document that owns the toolbar.
 * Inside Puck's canvas that is the iframe body, so these tests give each panel
 * an explicit container and assert the Radix portal lands there. They assert
 * containment, never position: the panel layout is Radix's, not ours.
 */

const editors: TiptapEditor[] = [];
const mountedRoots: Root[] = [];

const createEditor = (content = "<p>Scopri il Laboratorio</p>") => {
  const editor = new TiptapEditor({
    extensions: [StarterKit.configure({ link: false }), ...richTextExtensions],
    content,
  });

  editors.push(editor);
  return editor;
};

const mount = (node: ReactNode) => {
  const host = document.createElement("div");
  document.body.append(host);

  const root = createRoot(host);
  mountedRoots.push(root);

  act(() => root.render(node));

  return host;
};

const createPortalHost = () => {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
};

const findButton = (scope: ParentNode, label: string) => {
  const button = scope.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  );

  if (!button) throw new Error(`Button "${label}" not found`);

  return button;
};

const click = async (element: Element) => {
  await act(async () => {
    element.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
};

const clickPanelButton = async (container: HTMLElement, label: string) => {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label,
  );

  if (!button) throw new Error(`Panel button "${label}" not found`);

  await click(button);
};

const typeLinkHref = async (container: HTMLElement, href: string) => {
  const input = container.querySelector<HTMLInputElement>(
    '[aria-label="Link URL"]',
  );

  if (!input) throw new Error("Link URL input not found");

  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    setter?.call(input, href);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

afterEach(() => {
  for (const root of mountedRoots.splice(0)) act(() => root.unmount());
  for (const editor of editors.splice(0)) editor.destroy();
  document.body.replaceChildren();
});

describe("rich text menu portal container", () => {
  it("uses the body of the document the editor lives in", () => {
    // A synthetic document stands in for the canvas iframe: its body is a
    // different object from the one the test runs in.
    const frameDocument = document.implementation.createHTMLDocument("frame");
    const editor = {
      view: { dom: { ownerDocument: frameDocument } },
    } as unknown as Editor;

    expect(getRichTextMenuPortalContainer(editor)).toBe(frameDocument.body);
  });

  it("has no container when the editor has not mounted yet", () => {
    expect(getRichTextMenuPortalContainer(null)).toBeNull();
  });
});

describe("LinkPickerPopover", () => {
  it("portals the panel into the container it is given", async () => {
    const editor = createEditor();
    const container = createPortalHost();

    mount(<LinkPickerPopover editor={editor} container={container} />);

    await click(findButton(document, "Add link"));

    const panel = container.querySelector('[aria-label="Link URL"]');

    expect(panel).not.toBeNull();
    expect(document.body.contains(panel)).toBe(true);
    expect(container.contains(panel)).toBe(true);
  });

  it("applies and removes a link from the panel", async () => {
    const editor = createEditor();
    const container = createPortalHost();
    editor.commands.setTextSelection({ from: 1, to: 7 });

    mount(<LinkPickerPopover editor={editor} container={container} />);

    await click(findButton(document, "Add link"));
    await typeLinkHref(container, "https://example.com/lab");
    await clickPanelButton(container, "Apply");

    expect(editor.getAttributes("link").href).toBe("https://example.com/lab");

    editor.commands.setTextSelection({ from: 1, to: 7 });
    await click(findButton(document, "Edit link"));
    await clickPanelButton(container, "Remove");

    expect(editor.isActive("link")).toBe(false);
  });

  it("writes target and rel only when open-in-new-tab is checked", async () => {
    const editor = createEditor();
    const container = createPortalHost();
    editor.commands.setTextSelection({ from: 1, to: 7 });

    mount(<LinkPickerPopover editor={editor} container={container} />);

    await click(findButton(document, "Add link"));
    await typeLinkHref(container, "https://example.com/lab");

    const checkbox = container.querySelector('[role="checkbox"]');

    if (!checkbox) throw new Error("Open in new tab checkbox not found");
    await click(checkbox);
    await clickPanelButton(container, "Apply");

    expect(editor.getAttributes("link")).toMatchObject({
      href: "https://example.com/lab",
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });
});

describe("ColorPickerPopover", () => {
  it("portals the panel into the container it is given", async () => {
    const editor = createEditor();
    const container = createPortalHost();

    mount(<ColorPickerPopover editor={editor} container={container} />);

    await click(findButton(document, "Text color"));

    expect(container.textContent).toContain("Rimuovi colore");
  });

  it("applies a palette colour and shows the current one", async () => {
    const editor = createEditor();
    const container = createPortalHost();
    editor.commands.setTextSelection({ from: 1, to: 7 });

    mount(<ColorPickerPopover editor={editor} container={container} />);

    await click(findButton(document, "Text color"));

    await click(findButton(container, "#ef4444"));

    expect(editor.getAttributes("textStyle").color).toBe("#ef4444");
    expect(findButton(container, "#ef4444").getAttribute("aria-pressed")).toBe(
      "true",
    );
  });
});
