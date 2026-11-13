"use client";

import "client-only";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ComponentConfig,
  Config,
  PuckComponent,
  PuckContext,
} from "@puckeditor/core";

import { useEditorStore } from "../store/use-editor-store";

/**
 * Marks the block root while its inline editor is armed.
 *
 * It is set and removed imperatively, from outside React, so arming a block
 * never re-renders it: the editor keeps its DOM node and the layout does not
 * move. The attribute only ever exists in the editor canvas — it is the hook
 * the stylesheet in `puck-base.css` flips — so the published page cannot carry
 * it and the canvas markup at rest stays identical to the page's.
 */
export const TEXT_EDIT_MODE_ATTRIBUTE = "data-text-editing";

/** The element that accepts the caret inside a text block. */
const CONTENT_EDITABLE_SELECTOR = '[contenteditable="true"]';

/**
 * Does this block author its text on the canvas?
 *
 * The test is the field descriptor, not a list of block names: every block
 * that mounts an inline rich text field gets the gate, so a future text block
 * inherits the behaviour without being registered here.
 */
export function hasInlineRichTextField(config: ComponentConfig<any>): boolean {
  return Object.values(config.fields ?? {}).some((field) => {
    const candidate = field as {
      type?: string;
      contentEditable?: boolean;
    } | null;

    // `contentEditable: false` is Puck's non-editable richtext (it renders a
    // static tree instead of the editor), so there is no mode to open.
    return (
      candidate?.type === "richtext" && candidate.contentEditable !== false
    );
  });
}

/**
 * Put the caret where the gesture landed, then focus the editor.
 *
 * The point is resolved before the focus on purpose: `caretRangeFromPoint`
 * measures the point against the rendered text, and the focus preserves the
 * range it finds. A point that does not resolve inside the editor — the block's
 * padding, an empty block — falls back to the end of the text, so the mode
 * always opens with a live caret.
 */
function focusEditorAtPoint(editor: HTMLElement, x: number, y: number) {
  const doc = editor.ownerDocument;
  const selection = doc.getSelection();

  if (!selection) {
    editor.focus();
    return;
  }

  const range =
    typeof doc.caretRangeFromPoint === "function"
      ? doc.caretRangeFromPoint(x, y)
      : null;

  if (range && editor.contains(range.startContainer)) {
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    const end = doc.createRange();
    end.selectNodeContents(editor);
    end.collapse(false);
    selection.removeAllRanges();
    selection.addRange(end);
  }

  editor.focus();
}

/**
 * Lock a text block until it is deliberately opened.
 *
 * Applied to the editor configs only. The shared render and the public config
 * do not know this wrapper, so the published page ships neither the store nor
 * the listener, and the locked look is a stylesheet rule rather than markup.
 *
 * While locked, `puck-base.css` keeps the editor's descendants out of
 * hit-testing: a click selects the block without a caret, and a long press with
 * movement drags it like any other block. A double click arms the block by
 * naming it in the editor store; the store's subscription flips the attribute
 * and the same stylesheet gives the editor its pointer back, with no re-render
 * of the block.
 */
export function withTextEditGate(
  config: ComponentConfig<any>,
): ComponentConfig<any> {
  if (!hasInlineRichTextField(config)) return config;

  const Render = config.render;

  const GatedRender: PuckComponent<any> = (props) =>
    props.puck?.isEditing ? (
      <TextEditGate blockProps={props} Render={Render} />
    ) : (
      // A read-only render (`<Render>` for the Site layout preview, the public
      // page) has nothing to gate: it keeps the plain block, with no listener
      // and no store subscription. No hook runs here either, so calling the
      // render function directly (as some pipeline tests do) still works.
      <Render {...props} />
    );

  return { ...config, render: GatedRender };
}

type GatedBlockProps = Record<string, any> & {
  id: string;
  puck: PuckContext;
};

/**
 * The armed/locked behaviour, mounted only on the canvas.
 *
 * It is a separate component so the gate above stays hook-free: only the
 * editing path carries the store subscription and the native listener, which
 * is the point of applying this wrapper to editor configs alone.
 */
function TextEditGate({
  blockProps,
  Render,
}: {
  blockProps: GatedBlockProps;
  Render: PuckComponent<any>;
}) {
  const id = blockProps.id;
  const dragRef = blockProps.puck.dragRef;

  const rootNodeRef = useRef<HTMLElement | null>(null);
  const dragRefRef = useRef(dragRef);

  // Keep the latest ref for the callback below without re-attaching it on
  // every render: a new ref identity would make React detach the block root
  // and measure it again.
  useEffect(() => {
    dragRefRef.current = dragRef;
  }, [dragRef]);

  const [root, setRoot] = useState<HTMLElement | null>(null);

  /**
   * The block's only ref now, so Puck keeps receiving the element it selects,
   * measures and drags. The state is set once per element and only to run the
   * effect below; it never changes while the block is armed.
   */
  const setRootNode = useCallback((element: Element | null) => {
    const next = (element as HTMLElement | null) ?? null;

    if (rootNodeRef.current !== next) {
      rootNodeRef.current = next;
      setRoot(next);
    }

    dragRefRef.current?.(element);
  }, []);

  useEffect(() => {
    if (!root) return;

    const syncAttribute = (editingTextBlockId: string | null) => {
      if (editingTextBlockId === id) {
        root.setAttribute(TEXT_EDIT_MODE_ATTRIBUTE, "");
      } else {
        root.removeAttribute(TEXT_EDIT_MODE_ATTRIBUTE);
      }
    };

    // A block mounted while another one is armed must be locked, and one
    // remounted by React must restore its own state from the store.
    syncAttribute(useEditorStore.getState().editingTextBlockId);

    // Subscribing instead of selecting a value keeps arming out of React's
    // render path: one block at a time, no re-render, no remount. A second
    // block arming removes the attribute from this one. The id is the only
    // state that matters here, so zoom and layout changes do not touch the DOM.
    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (state.editingTextBlockId !== previous.editingTextBlockId) {
        syncAttribute(state.editingTextBlockId);
      }
    });

    const onDoubleClick = (event: MouseEvent) => {
      // Already armed: the double click belongs to the editor (it is how a
      // word is selected inside the text), not to the mode.
      if (useEditorStore.getState().editingTextBlockId === id) return;

      useEditorStore.getState().enterTextEditMode(id);

      const editor = root.querySelector<HTMLElement>(
        CONTENT_EDITABLE_SELECTOR,
      );

      if (editor) focusEditorAtPoint(editor, event.clientX, event.clientY);
    };

    root.addEventListener("dblclick", onDoubleClick);

    return () => {
      root.removeEventListener("dblclick", onDoubleClick);
      unsubscribe();
      root.removeAttribute(TEXT_EDIT_MODE_ATTRIBUTE);
    };
  }, [root, id]);

  return (
    <Render
      {...blockProps}
      puck={{ ...blockProps.puck, dragRef: setRootNode }}
    />
  );
}

/**
 * Apply the gate to every block in an editor registry that edits text on the
 * canvas and leave the rest untouched.
 *
 * The registry stays the single place a block is declared; this is a view over
 * it, so a new text block cannot be added and forget the locked state.
 */
export function gateTextBlocks(
  components: Config["components"],
): Config["components"] {
  return Object.fromEntries(
    Object.entries(components).map(([name, config]) => [
      name,
      withTextEditGate(config as ComponentConfig<any>),
    ]),
  ) as Config["components"];
}

/**
 * The editor config: the shared template with the text blocks gated.
 *
 * The editor shell is the only caller, and it is where the editor-only
 * behaviour belongs: the shared registry and the public render config never
 * import this module, so neither the store nor the listener can reach the
 * published bundle.
 */
export function gateEditorConfig(config: Config): Config {
  return { ...config, components: gateTextBlocks(config.components) };
}

