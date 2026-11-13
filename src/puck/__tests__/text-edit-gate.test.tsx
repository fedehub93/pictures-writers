// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ComponentConfig, PuckContext } from "@puckeditor/core";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContainerBlock } from "../blocks/Container";
import { renderHeadingBlock } from "../blocks/Heading/render";
import { ImageBlock } from "../blocks/Image";
import { renderTextBlock } from "../blocks/Text/render";
import { config as pageEditorConfig } from "../config";
import { useEditorStore } from "../editor/store/use-editor-store";
import {
  gateEditorConfig,
  gateTextBlocks,
  hasInlineRichTextField,
  TEXT_EDIT_MODE_ATTRIBUTE,
  withTextEditGate,
} from "../editor/text-edit-mode/text-edit-gate";
import { richTextDescriptors } from "../fields/rich-text/presets";
import { pageRenderConfig } from "../render-config";

import { declarations, readPuckBaseRules } from "./helpers/css-rules";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: true,
  dragRef: null,
};

/**
 * A block that authors its text on the canvas, with a render the tests can
 * count and inspect. It declares the same rich text descriptor the real text
 * blocks do, so the registry treats it exactly like a future text block.
 */
function createProbeBlock() {
  const render = vi.fn(
    ({ text, puck }: { text?: React.ReactNode; puck?: PuckContext }) => (
      <div ref={puck?.dragRef} data-block>
        {text}
      </div>
    ),
  );

  const config: ComponentConfig<any> = {
    fields: { text: richTextDescriptors.text },
    render,
  };

  return { config, render };
}

/** A block that does not edit text on the canvas. */
function createPlainBlock() {
  const render = vi.fn(() => <div data-block />);
  const config: ComponentConfig<any> = {
    fields: { image: { type: "image" } },
    render,
  };

  return { config, render };
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function cleanup() {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  useEditorStore.getState().exitTextEditMode();
}

afterEach(cleanup);

async function mount(node: React.ReactNode) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);

  await act(async () => {
    root!.render(node);
  });

  return host;
}

/**
 * Render a block the way Puck does: as a component, not by calling the render
 * function. The gate uses hooks, so calling it directly is outside React.
 */
function blockElement(
  render: ComponentConfig<any>["render"],
  props: Record<string, unknown>,
) {
  return createElement(render as React.FunctionComponent<any>, props);
}

/** The contenteditable subtree Puck mounts inside a text block's portal. */
function createEditor() {
  return (
    <div data-editor contentEditable suppressContentEditableWarning>
      Probe heading
    </div>
  );
}

function doubleClick(element: Element, point = { x: 10, y: 10 }) {
  act(() => {
    element.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        clientX: point.x,
        clientY: point.y,
      }),
    );
  });
}

describe("text editing gate", () => {
  it("recognises a block by the field descriptor, not by name", () => {
    expect(hasInlineRichTextField(createProbeBlock().config)).toBe(true);
    expect(hasInlineRichTextField(createPlainBlock().config)).toBe(false);

    // A richtext field that cannot be edited on the canvas has no mode.
    expect(
      hasInlineRichTextField({
        fields: { text: { type: "richtext", contentEditable: false } },
        render: () => <div />,
      }),
    ).toBe(false);
  });

  it("gates the text blocks of the editor registry and leaves the others alone", () => {
    const text = createProbeBlock();
    const plain = createPlainBlock();

    const gated = gateTextBlocks({
      Text: text.config,
      Plain: plain.config,
    });

    expect(gated.Plain).toBe(plain.config);
    expect(gated.Text).not.toBe(text.config);
    expect(gated.Text.render).not.toBe(text.render);
    expect(gated.Text.fields).toBe(text.config.fields);
  });

  it("is applied to the editor Heading and Text only", () => {
    const editorConfig = gateEditorConfig(pageEditorConfig);

    expect(editorConfig.components.Heading.render).not.toBe(renderHeadingBlock);
    expect(editorConfig.components.Text.render).not.toBe(renderTextBlock);
    expect(editorConfig.components.Image.render).toBe(ImageBlock.render);
    expect(editorConfig.root).toBe(pageEditorConfig.root);
    expect(editorConfig.categories).toBe(pageEditorConfig.categories);
  });

  it("leaves the shared registry free of editor runtime", () => {
    // The gate is applied by the editor shell: the module the public types and
    // palettes read still exports each block's own render.
    expect(pageEditorConfig.components.Heading.render).toBe(renderHeadingBlock);
    expect(pageEditorConfig.components.Text.render).toBe(renderTextBlock);
    expect(pageEditorConfig.components.Container).toBe(ContainerBlock);
  });

  it("does not wrap a block without an inline rich text field", () => {
    const { config } = createPlainBlock();

    expect(withTextEditGate(config)).toBe(config);
  });

  it("keeps the resting markup identical to the published block", () => {
    const props = {
      text: "Hello",
      typography: { desktop: { fontSize: "18px" } },
    };

    const gatedText = gateTextBlocks(pageEditorConfig.components).Text;

    const canvas = renderToStaticMarkup(
      blockElement(gatedText.render, {
        ...props,
        id: "text",
        puck: { ...PUCK, dragRef: () => undefined },
      }),
    );

    const page = renderToStaticMarkup(
      blockElement(pageRenderConfig.components.Text.render, {
        ...props,
        id: "text",
        puck: { ...PUCK, isEditing: false, dragRef: null },
      }),
    );

    expect(page).toBe(canvas);
    expect(canvas).not.toContain(TEXT_EDIT_MODE_ATTRIBUTE);
  });

  it("locks the block until a double click opens the editor", async () => {
    const { config, render } = createProbeBlock();
    const gated = withTextEditGate(config);
    const dragRef = vi.fn();
    const editor = createEditor();

    const container = await mount(
      blockElement(gated.render, {
        id: "text",
        text: editor,
        puck: { ...PUCK, dragRef },
      }),
    );

    const blockRoot = container.querySelector("[data-block]") as HTMLElement;
    const editorNode = container.querySelector("[data-editor]");

    expect(dragRef).toHaveBeenCalledWith(blockRoot);
    expect(blockRoot.hasAttribute(TEXT_EDIT_MODE_ATTRIBUTE)).toBe(false);

    // Mounting resolves the ref once, so the count is taken after it settles.
    const rendersAtRest = render.mock.calls.length;

    doubleClick(blockRoot);

    expect(useEditorStore.getState().editingTextBlockId).toBe("text");
    expect(blockRoot.hasAttribute(TEXT_EDIT_MODE_ATTRIBUTE)).toBe(true);

    // Arming is a stylesheet flip, not a React render: the editor keeps its
    // node and the block keeps its DOM.
    expect(render).toHaveBeenCalledTimes(rendersAtRest);
    expect(container.querySelector("[data-editor]")).toBe(editorNode);
  });

  it("moves the caret to the double clicked point before focusing", async () => {
    const { config } = createProbeBlock();
    const gated = withTextEditGate(config);
    const editor = createEditor();

    const container = await mount(
      blockElement(gated.render, { id: "text", text: editor, puck: { ...PUCK } }),
    );

    const blockRoot = container.querySelector("[data-block]") as HTMLElement;
    const editorNode = container.querySelector("[data-editor]") as HTMLElement;
    const textNode = editorNode.firstChild as Text;

    const range = document.createRange();
    range.setStart(textNode, 6);
    range.collapse(true);

    const caretRangeFromPoint = vi.fn(() => range);
    (
      document as Document & { caretRangeFromPoint?: () => Range }
    ).caretRangeFromPoint = caretRangeFromPoint;

    doubleClick(blockRoot, { x: 12, y: 24 });

    expect(caretRangeFromPoint).toHaveBeenCalledWith(12, 24);
    expect(document.activeElement).toBe(editorNode);
    expect(document.getSelection()?.anchorNode).toBe(textNode);
    expect(document.getSelection()?.anchorOffset).toBe(6);
  });

  it("falls back to the end of the text when the point does not resolve", async () => {
    const { config } = createProbeBlock();
    const gated = withTextEditGate(config);
    const editor = createEditor();

    const container = await mount(
      blockElement(gated.render, { id: "text", text: editor, puck: { ...PUCK } }),
    );

    doubleClick(container.querySelector("[data-block]") as HTMLElement);

    const editorNode = container.querySelector("[data-editor]") as HTMLElement;

    expect(document.activeElement).toBe(editorNode);
    expect(document.getSelection()?.anchorNode).toBe(editorNode);
    expect(document.getSelection()?.anchorOffset).toBe(
      editorNode.childNodes.length,
    );
  });

  it("keeps one block armed at a time", async () => {
    const { config } = createProbeBlock();
    const gated = withTextEditGate(config);

    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);

    await act(async () => {
      root!.render(
        <>
          {blockElement(gated.render, {
            id: "first",
            text: "One",
            puck: { ...PUCK },
          })}
          {blockElement(gated.render, {
            id: "second",
            text: "Two",
            puck: { ...PUCK },
          })}
        </>,
      );
    });

    const [first, second] = Array.from(
      host.querySelectorAll<HTMLElement>("[data-block]"),
    );

    doubleClick(first);
    expect(first.hasAttribute(TEXT_EDIT_MODE_ATTRIBUTE)).toBe(true);
    expect(second.hasAttribute(TEXT_EDIT_MODE_ATTRIBUTE)).toBe(false);

    doubleClick(second);
    expect(useEditorStore.getState().editingTextBlockId).toBe("second");
    expect(first.hasAttribute(TEXT_EDIT_MODE_ATTRIBUTE)).toBe(false);
    expect(second.hasAttribute(TEXT_EDIT_MODE_ATTRIBUTE)).toBe(true);

    act(() => useEditorStore.getState().exitTextEditMode());
    expect(second.hasAttribute(TEXT_EDIT_MODE_ATTRIBUTE)).toBe(false);
  });

  it("does nothing on a render that is not the editor canvas", async () => {
    const { config, render } = createProbeBlock();
    const gated = withTextEditGate(config);
    const dragRef = vi.fn();

    const container = await mount(
      blockElement(gated.render, {
        id: "text",
        text: "Hello",
        puck: { ...PUCK, isEditing: false, dragRef },
      }),
    );

    doubleClick(container.querySelector("[data-block]") as HTMLElement);

    expect(useEditorStore.getState().editingTextBlockId).toBeNull();
    expect(container.querySelector("[data-block]")?.hasAttribute(
      TEXT_EDIT_MODE_ATTRIBUTE,
    )).toBe(false);
    // The read-only path keeps the props it was given, including the ref:
    // nothing here wraps or replays Puck's ref.
    const lastProps = render.mock.calls.at(-1)?.[0] as
      | { puck?: PuckContext }
      | undefined;

    expect(lastProps?.puck?.dragRef).toBe(dragRef);
  });
});

describe("text editing mode stylesheet", () => {
  const rules = readPuckBaseRules();

  const selectorsOf = (selector: string) =>
    selector
      .split(",")
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter(Boolean);

  const ruleWith = (selector: string) =>
    rules.find(
      (rule) => !rule.media && selectorsOf(rule.selector).includes(selector),
    );

  const pointerEventsOf = (selector: string) => {
    const rule = ruleWith(selector);

    if (!rule) throw new Error(`puck-base.css has no rule for ${selector}`);

    return declarations(rule).get("pointer-events");
  };

  const LOCKED_PORTAL = "[data-puck-component] [data-puck-overlay-portal]";
  const ARMED_PORTAL =
    "[data-puck-component][data-text-editing] [data-puck-overlay-portal]";

  it.each([LOCKED_PORTAL, `${LOCKED_PORTAL} *`])(
    "keeps the locked block's editor out of hit-testing: %s",
    (selector) => {
      // `!important` is the contract: Puck forces `pointer-events: auto
      // !important` on the portal, so the lock has to outrank it.
      expect(pointerEventsOf(selector)).toBe("none !important");
    },
  );

  it.each([ARMED_PORTAL, `${ARMED_PORTAL} *`])(
    "gives the armed block's editor its pointer back: %s",
    (selector) => {
      expect(pointerEventsOf(selector)).toBe("auto !important");
    },
  );

  it("ships the rules from the project stylesheet the canvas mirrors", () => {
    // Two halves make the reach: the rule tests above read these declarations
    // out of `puck-base.css`, and Puck mirrors every stylesheet in the host
    // document into the canvas iframe. The admin layout import is what puts
    // this sheet in the host document; a rule injected from a component
    // `<style>` would not be pinned to it.
    const layout = readFileSync(
      resolve(process.cwd(), "src/app/(admin)/layout.tsx"),
      "utf8",
    );

    expect(layout).toContain('import "@/puck/styles/puck-base.css";');
  });
});

describe("editor store", () => {
  it("arms one block and clears the state on exit", () => {
    const store = useEditorStore.getState();

    expect(store.editingTextBlockId).toBeNull();

    store.enterTextEditMode("block-1");
    expect(useEditorStore.getState().editingTextBlockId).toBe("block-1");

    useEditorStore.getState().enterTextEditMode("block-2");
    expect(useEditorStore.getState().editingTextBlockId).toBe("block-2");

    useEditorStore.getState().exitTextEditMode();
    expect(useEditorStore.getState().editingTextBlockId).toBeNull();
  });
});


