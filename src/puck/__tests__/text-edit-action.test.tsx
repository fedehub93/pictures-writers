// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ComponentConfig, ComponentData, Permissions } from "@puckeditor/core";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config as pageEditorConfig } from "../config";
import { contentFieldPath } from "../editor/text-edit-mode/content-field";
import { useEditorStore } from "../editor/store/use-editor-store";
import {
  ActionBarWithTextEdit,
  BlockActionBar,
  textEditOverrides,
  type ActionBarWithTextEditProps,
  type BlockActionBarProps,
} from "../editor/text-edit-mode/text-edit-action-bar";
import {
  TEXT_EDIT_ACTION_LABELS,
  canEditText,
  textEditAction,
} from "../editor/text-edit-mode/text-edit-action";
import {
  findBlockRoot,
  focusTextEditor,
} from "../editor/text-edit-mode/text-editor-dom";

import { declarations, readPuckBaseRules } from "./helpers/css-rules";

const ALL_PERMISSIONS: Permissions = {
  drag: true,
  duplicate: true,
  delete: true,
  edit: true,
  insert: true,
};

/** A block of the editor's own registry, as Puck hands it to the bar. */
function block(type: string, id: string, readOnly?: Record<string, boolean>) {
  return {
    type,
    props: { id },
    ...(readOnly ? { readOnly } : {}),
  } as ComponentData;
}

function target(overrides: Partial<Parameters<typeof textEditAction>[0]> = {}) {
  return {
    blockId: "heading",
    config: pageEditorConfig.components.Heading as ComponentConfig<any>,
    item: block("Heading", "heading"),
    permissions: ALL_PERMISSIONS,
    editingBlockId: null,
    ...overrides,
  };
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

async function mount(node: React.ReactNode) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);

  await act(async () => {
    root!.render(node);
  });

  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  useEditorStore.getState().exitTextEditMode();
  document.querySelectorAll("[data-puck-component]").forEach((node) => node.remove());
});

function bar(overrides: Partial<ActionBarWithTextEditProps> = {}) {
  const onToggle = vi.fn();
  const {
    action = { blockId: "heading", editing: false, label: "Edit text" },
  } = overrides;

  const node = (
    <ActionBarWithTextEdit
      label="Heading"
      parentAction={<button data-slot="parent" type="button" />}
      dragHandle={<button data-slot="handle" type="button" />}
      action={action}
      onToggle={onToggle}
    >
      <div data-puck-rte-menu>
        <button data-slot="toolbar" type="button" />
      </div>
      <button data-slot="puck" type="button" />
    </ActionBarWithTextEdit>
  );

  return { node, onToggle, action };
}

function selectedBar(overrides: Partial<BlockActionBarProps> = {}) {
  const node = (
    <BlockActionBar
      label="Heading"
      parentAction={<button data-slot="parent" type="button" />}
      dragHandle={null}
      selectedItem={block("Heading", "heading")}
      config={pageEditorConfig.components.Heading as ComponentConfig<any>}
      permissions={ALL_PERMISSIONS}
      {...overrides}
    >
      <button data-slot="puck" type="button" />
    </BlockActionBar>
  );

  return node;
}

describe("the text action", () => {
  it("reads the content field from the descriptor, not from a list of blocks", () => {
    expect(contentFieldPath(pageEditorConfig.components.Heading)).toBe("text");
    expect(contentFieldPath(pageEditorConfig.components.Text)).toBe("text");
    expect(contentFieldPath(pageEditorConfig.components.Image)).toBeNull();

    // A richtext field that Puck renders statically has no mode to open.
    expect(
      contentFieldPath({
        fields: { body: { type: "richtext", contentEditable: false } },
        render: () => <div />,
      }),
    ).toBeNull();
  });

  it("offers the mode on the selected text block", () => {
    expect(textEditAction(target())).toEqual({
      blockId: "heading",
      editing: false,
      label: TEXT_EDIT_ACTION_LABELS.enter,
    });
    expect(
      textEditAction(
        target({
          config: pageEditorConfig.components.Text,
          item: block("Text", "heading"),
        }),
      ),
    ).toEqual({ blockId: "heading", editing: false, label: "Edit text" });
  });

  it("offers nothing on a block without a content field", () => {
    expect(
      textEditAction(
        target({
          config: pageEditorConfig.components.Image as ComponentConfig<any>,
          item: block("Image", "heading"),
        }),
      ),
    ).toBeNull();
  });

  it("offers nothing on a block whose field is declared non-editable", () => {
    const config: ComponentConfig<any> = {
      fields: { text: { type: "richtext", contentEditable: false } },
      render: () => <div />,
    };

    expect(textEditAction(target({ config }))).toBeNull();
    expect(canEditText({ config, permissions: ALL_PERMISSIONS })).toBe(false);
  });

  it("offers nothing when the permissions make the block read-only", () => {
    expect(
      textEditAction(target({ permissions: { ...ALL_PERMISSIONS, edit: false } })),
    ).toBeNull();
  });

  it("offers nothing when the content field is read-only on the block", () => {
    expect(
      textEditAction(target({ item: block("Heading", "heading", { text: true }) })),
    ).toBeNull();

    // A read-only sibling field is not the content field.
    expect(
      textEditAction(
        target({ item: block("Heading", "heading", { level: true }) }),
      ),
    ).not.toBeNull();
  });

  it("offers nothing while no block is selected", () => {
    expect(textEditAction(target({ blockId: null }))).toBeNull();
  });

  it("reflects the block the store opened, whichever gesture opened it", () => {
    expect(textEditAction(target({ editingBlockId: "heading" }))).toEqual({
      blockId: "heading",
      editing: true,
      label: TEXT_EDIT_ACTION_LABELS.exit,
    });

    // Another text block is in the mode: this one still offers to open.
    expect(textEditAction(target({ editingBlockId: "other" }))).toEqual({
      blockId: "heading",
      editing: false,
      label: TEXT_EDIT_ACTION_LABELS.enter,
    });
  });
});

describe("the action bar", () => {
  it("draws the action as a labelled toggle", async () => {
    const { node } = bar({
      action: { blockId: "heading", editing: true, label: "Done" },
    });

    const container = await mount(node);
    const button = container.querySelector<HTMLButtonElement>(
      "[data-text-edit-action]",
    );

    expect(button).not.toBeNull();
    expect(button?.tagName).toBe("BUTTON");
    expect(button?.type).toBe("button");
    // Keyboard reachable, named by its own text, and it says which state it is.
    expect(button?.tabIndex).toBe(0);
    expect(button?.textContent).toBe("Done");
    expect(button?.getAttribute("title")).toBe("Done");
    expect(button?.getAttribute("aria-pressed")).toBe("true");
  });

  it("says which state it is in", async () => {
    const { node } = bar();

    const container = await mount(node);
    const button = container.querySelector("[data-text-edit-action]");

    expect(button?.textContent).toBe("Edit text");
    expect(button?.getAttribute("aria-pressed")).toBe("false");
  });

  it("reports the press with the action it drew", async () => {
    const action = { blockId: "heading", editing: false, label: "Edit text" };
    const { node, onToggle } = bar({ action });

    const container = await mount(node);
    const button = container.querySelector<HTMLButtonElement>(
      "[data-text-edit-action]",
    );

    act(() => button?.click());

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle.mock.calls[0][1]).toBe(action);
  });

  it("keeps Puck's actions where Puck puts them", async () => {
    const { node } = bar();

    const container = await mount(node);
    const order = Array.from(
      container.querySelectorAll("[data-slot], [data-text-edit-action]"),
    ).map((node) => node.getAttribute("data-slot") ?? "text-edit");

    expect(order).toEqual([
      "parent",
      "toolbar",
      "puck",
      "text-edit",
      "handle",
    ]);
    expect(container.textContent).toContain("Heading");
  });

  it("leaves the bar untouched when the block has no action", async () => {
    const { node } = bar({ action: null });

    const container = await mount(node);

    expect(container.querySelector("[data-text-edit-action]")).toBeNull();
    expect(
      Array.from(container.querySelectorAll("[data-slot]")).map((node) =>
        node.getAttribute("data-slot"),
      ),
    ).toEqual(["parent", "toolbar", "puck", "handle"]);
  });

  it("shows the formatting toolbar only while the editor is open", async () => {
    // Puck's toolbar stays mounted while its own richtext state names the block,
    // and that state outlives the block: the bar must not show it on a locked
    // block, whatever Puck believes.
    const locked = await mount(bar().node);
    const wrapper = locked.querySelector(".puck-text-edit-actions");

    expect(wrapper?.hasAttribute("data-text-edit-armed")).toBe(false);

    act(() => root?.unmount());
    locked.remove();

    const open = await mount(
      bar({ action: { blockId: "heading", editing: true, label: "Done" } })
        .node,
    );

    expect(
      open
        .querySelector(".puck-text-edit-actions")
        ?.hasAttribute("data-text-edit-armed"),
    ).toBe(true);
  });
});

describe("the bar on the selected block", () => {
  it("draws the button for a selected Heading and for a selected Text", async () => {
    const heading = await mount(selectedBar());

    expect(heading.querySelector("[data-text-edit-action]")).not.toBeNull();

    act(() => root?.unmount());
    heading.remove();

    const text = await mount(
      selectedBar({
        selectedItem: block("Text", "paragraph"),
        config: pageEditorConfig.components.Text as ComponentConfig<any>,
      }),
    );

    expect(text.textContent).toContain("Edit text");
  });

  it("draws nothing for a selected block without a content field", async () => {
    const container = await mount(
      selectedBar({
        selectedItem: block("Image", "photo"),
        config: pageEditorConfig.components.Image as ComponentConfig<any>,
      }),
    );

    expect(container.querySelector("[data-text-edit-action]")).toBeNull();
  });

  it("draws nothing while no block is selected", async () => {
    const container = await mount(selectedBar({ selectedItem: null }));

    expect(container.querySelector("[data-text-edit-action]")).toBeNull();
  });

  it("opens the editor on the selected block and closes it again", async () => {
    // The block root and its inline editor, as the canvas holds them: the bar
    // is portalled next to them, not inside.
    const canvas = document.createElement("div");
    const blockRoot = document.createElement("div");
    const editor = document.createElement("div");

    blockRoot.setAttribute("data-puck-component", "heading");
    editor.setAttribute("contenteditable", "true");
    editor.append("Probe heading");
    blockRoot.append(editor);
    canvas.append(blockRoot);
    document.body.append(canvas);

    const container = await mount(selectedBar());
    const button = container.querySelector<HTMLButtonElement>(
      "[data-text-edit-action]",
    )!;

    expect(useEditorStore.getState().editingTextBlockId).toBeNull();

    act(() => button.click());

    expect(useEditorStore.getState().editingTextBlockId).toBe("heading");
    expect(document.activeElement).toBe(editor);
    expect(document.getSelection()?.isCollapsed).toBe(true);
    expect(document.getSelection()?.anchorOffset).toBe(
      editor.childNodes.length,
    );
    // The same button now says where the mode ends.
    expect(button.textContent).toBe("Done");
    expect(button.getAttribute("aria-pressed")).toBe("true");

    act(() => button.click());

    expect(useEditorStore.getState().editingTextBlockId).toBeNull();
    expect(button.textContent).toBe("Edit text");

    canvas.remove();
  });
});

describe("opening the mode from the bar", () => {
  it("finds the block root by id, without building a selector from it", () => {
    const other = document.createElement("div");
    const wanted = document.createElement("div");

    other.setAttribute("data-puck-component", "other");
    // A quote in an id would break an attribute selector built by string.
    wanted.setAttribute("data-puck-component", 'weird"id');
    document.body.append(other, wanted);

    expect(findBlockRoot(document, 'weird"id')).toBe(wanted);
    expect(findBlockRoot(document, "other")).toBe(other);
    expect(findBlockRoot(document, "missing")).toBeNull();

    other.remove();
    wanted.remove();
  });

  it("puts the caret at the end of the block's text", async () => {
    const node = createElement(
      "div",
      { "data-puck-component": "heading" },
      createElement(
        "div",
        { contentEditable: true, suppressContentEditableWarning: true },
        "Probe heading",
      ),
    );

    const container = await mount(node);
    const rootNode = findBlockRoot(document, "heading")!;
    const editorNode = rootNode.querySelector<HTMLElement>(
      '[contenteditable="true"]',
    )!;

    act(() => focusTextEditor(rootNode));

    expect(document.activeElement).toBe(editorNode);
    expect(document.getSelection()?.isCollapsed).toBe(true);
    expect(document.getSelection()?.anchorNode).toBe(editorNode);
    expect(document.getSelection()?.anchorOffset).toBe(
      editorNode.childNodes.length,
    );
    expect(container.contains(editorNode)).toBe(true);
  });
});

describe("the text edit stylesheet", () => {
  const rules = readPuckBaseRules();

  const rule = (selector: string) =>
    rules.find((candidate) => candidate.selector === selector);

  it("keeps the bar's layout with a contents wrapper", () => {
    // `display: contents` is what lets the wrapper scope the toolbar without
    // making itself a flex item of Puck's group.
    expect(declarations(rule(".puck-text-edit-actions")!).get("display")).toBe(
      "contents",
    );
  });

  it("hides the formatting toolbar on a block that is not in the mode", () => {
    const hidden = rule(
      ".puck-text-edit-actions:not([data-text-edit-armed]) [data-puck-rte-menu]",
    );

    expect(declarations(hidden!).get("display")).toBe("none");
  });
});

describe("editor wiring", () => {
  it("installs the override in the editor shell", () => {
    // The override is only reachable through `<Puck>`: a shell that stops
    // passing it removes the button with no other symptom, and no render path
    // can be mounted here to notice.
    const shell = readFileSync(
      resolve(process.cwd(), "src/puck/editor-shell.tsx"),
      "utf8",
    );

    expect(shell).toContain("overrides={textEditOverrides}");
    expect(textEditOverrides.actionBar).toBeTypeOf("function");
  });
});
