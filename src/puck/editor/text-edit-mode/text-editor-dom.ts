"use client";

import "client-only";

/** The element that accepts the caret inside a text block. */
export const CONTENT_EDITABLE_SELECTOR = '[contenteditable="true"]';

/**
 * Editor chrome that belongs to the armed block without living inside it: the
 * action bar (which holds the formatting toolbar) is portalled to the canvas
 * body, and the link and colour panels are portalled next to it. A press there
 * formats the text and must not close the mode.
 */
export const EDITOR_CHROME_SELECTOR = "[data-puck-overlay], [data-puck-rte-menu]";

/** Elements that own their own Enter key and must keep it. */
const TYPING_TARGET_SELECTOR =
  'input, textarea, select, button, [contenteditable]:not([contenteditable="false"])';

/** A collapsed range at the end of the editor's contents. */
function endOfContents(editor: HTMLElement) {
  const doc = editor.ownerDocument;
  const end = doc.createRange();

  end.selectNodeContents(editor);
  end.collapse(false);

  return end;
}

/**
 * The range is resolved before the focus on purpose: the focus preserves the
 * range it finds, and a range outside the editor would put the caret nowhere.
 */
function placeCaret(editor: HTMLElement, range: Range | null) {
  const doc = editor.ownerDocument;
  const selection = doc.getSelection();

  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range ?? endOfContents(editor));
  }

  editor.focus();
}

/**
 * Put the caret where the double click landed.
 *
 * `caretRangeFromPoint` measures the point against the rendered text. A point
 * that does not resolve inside the editor — the block's padding, an empty
 * block — falls back to the end of the text, so the mode always opens with a
 * live caret.
 */
export function placeCaretAtPoint(editor: HTMLElement, x: number, y: number) {
  const doc = editor.ownerDocument;
  const range =
    typeof doc.caretRangeFromPoint === "function"
      ? doc.caretRangeFromPoint(x, y)
      : null;

  placeCaret(
    editor,
    range && editor.contains(range.startContainer) ? range : null,
  );
}

/** Put the caret at the end of the text; `Enter` has no point to read. */
export function placeCaretAtEnd(editor: HTMLElement) {
  placeCaret(editor, null);
}

/**
 * Put the caret at the end of a block's text.
 *
 * The single place that opens the mode without a point to read: `Enter` on the
 * selected block and the action bar's button both land here, so they open on
 * the same caret.
 */
export function focusTextEditor(root: HTMLElement) {
  const editor = root.querySelector<HTMLElement>(CONTENT_EDITABLE_SELECTOR);

  if (editor) placeCaretAtEnd(editor);
}

/**
 * Find a block's root in a document.
 *
 * The canvas tags the node it selects, measures and drags with the block's id,
 * and the action bar is portalled into that same document: this is how a
 * control in the chrome reaches the block it belongs to. The attribute is read
 * by value rather than by selector, so an id can never leak into the query.
 */
export function findBlockRoot(
  doc: Document,
  blockId: string,
): HTMLElement | null {
  const roots = doc.querySelectorAll<HTMLElement>("[data-puck-component]");

  for (const root of roots) {
    if (root.getAttribute("data-puck-component") === blockId) return root;
  }

  return null;
}

/**
 * Collapse a selection that is inside the editor.
 *
 * Leaving the mode hides the toolbar, and a highlighted word with no toolbar
 * next to it is a selection the author cannot act on.
 */
function collapseSelectionInside(editor: HTMLElement) {
  const doc = editor.ownerDocument;
  const selection = doc.getSelection();

  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  if (!editor.contains(range.commonAncestorContainer)) return;

  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Move focus to the block root, which is not focusable on its own.
 *
 * The attribute is temporary: it exists only for the duration of the focus
 * call, so the block root is not left with an editor artifact.
 */
function focusBlockRoot(root: HTMLElement) {
  const hadTabIndex = root.hasAttribute("tabindex");

  if (!hadTabIndex) root.setAttribute("tabindex", "-1");

  root.focus();

  if (!hadTabIndex) root.removeAttribute("tabindex");
}

/**
 * Tell Puck the editor lost focus.
 *
 * `relatedTarget` is the part that matters: Puck's blur handler clears the
 * richtext state — and with it the formatting toolbar — only when the event
 * names the next focus, and keeps the toolbar mounted otherwise.
 */
function handEditorBack(editor: HTMLElement, root: HTMLElement) {
  editor.dispatchEvent(
    new FocusEvent("focusout", { bubbles: true, relatedTarget: root }),
  );
}

/**
 * Hand the editor back to Puck when the mode ends.
 *
 * The mode exits by focusing the block root: a real blur with a related
 * target. When the editor was already blurred (the press landed on the page
 * background), the same `focusout` is replayed on the editor with the new
 * focus as its related target.
 */
export function releaseEditor(root: HTMLElement) {
  const editor = root.querySelector<HTMLElement>(CONTENT_EDITABLE_SELECTOR);
  const doc = root.ownerDocument;

  if (!editor) {
    focusBlockRoot(root);
    return;
  }

  const active = doc.activeElement;
  const editorHadFocus = !!active && editor.contains(active);

  collapseSelectionInside(editor);
  focusBlockRoot(root);

  if (!editorHadFocus) handEditorBack(editor, root);
}

/** Enter pressed on a focused control is that control's business. */
export function keepsOwnEnterKey(target: EventTarget | null) {
  const element = target as Element | null;

  if (!element || typeof element.closest !== "function") return false;

  return !!element.closest(TYPING_TARGET_SELECTOR);
}
