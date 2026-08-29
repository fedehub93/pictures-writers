import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";

export interface PostOutlineHeading {
  id: string;
  level: 2 | 3 | 4;
  label: string;
  position: number;
}

const EMPTY_HEADING_LABEL = "Section without title";
const OUTLINE_LEVELS = new Set([2, 3, 4]);

/**
 * Altezza della navbar sticky che copre la parte alta dell'area di lavoro.
 * Viene sottratta dalla posizione di scroll così l'heading navigato non
 * finisce nascosto sotto la navbar.
 */
export const POST_OUTLINE_STICKY_NAV_OFFSET = 72;

/**
 * Projects the current ProseMirror document into the temporary view model used
 * by the admin outline. Nothing from this projection is written back to the
 * editor document.
 */
export function getPostOutlineHeadings(editor: Editor): PostOutlineHeading[] {
  const headings: PostOutlineHeading[] = [];

  editor.state.doc.descendants((node, position) => {
    // TableContentNode is public content. Its descendants must not become
    // entries in this private admin navigation.
    if (node.type.name === "tablecontent") return false;

    if (node.type.name !== "heading") return;

    const level = Number(node.attrs.level);
    if (!OUTLINE_LEVELS.has(level)) return;

    const label = node.textContent.trim() || EMPTY_HEADING_LABEL;
    headings.push({
      // This is deliberately derived from the current document position. It
      // is a view-only key and is never added to the Tiptap JSON.
      id: `post-outline-${position}-${headings.length}`,
      level: level as PostOutlineHeading["level"],
      label,
      position,
    });
  });

  return headings;
}

export function getPostOutlineScrollContainer(editor: Editor): HTMLElement {
  const radixViewport = editor.view.dom.closest<HTMLElement>(
    "[data-radix-scroll-area-viewport]",
  );
  if (radixViewport) return radixViewport;

  let element = editor.view.dom.parentElement;
  while (element && element !== document.body) {
    const overflowY = window.getComputedStyle(element).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return element;
    element = element.parentElement;
  }

  return editor.view.dom.parentElement ?? editor.view.dom;
}

function getHeadingElement(
  editor: Editor,
  heading: PostOutlineHeading,
): HTMLElement | null {
  const element = editor.view.nodeDOM(heading.position);
  return element instanceof HTMLElement ? element : null;
}

/**
 * Returns the heading currently nearest the top of the visible editor area.
 * The result is intentionally null when no heading is visible. This prevents
 * an unseen first heading from being marked active on initial render.
 */
export function findVisiblePostOutlineHeading(
  editor: Editor,
  headings: PostOutlineHeading[],
): PostOutlineHeading | null {
  const container = getPostOutlineScrollContainer(editor);
  const containerRect = container.getBoundingClientRect();
  const positioned = headings.flatMap((heading) => {
    const element = getHeadingElement(editor, heading);
    if (!element) return [];
    return [{ heading, rect: element.getBoundingClientRect() }];
  });
  const visible = positioned.filter(
    ({ rect }) =>
      rect.bottom > containerRect.top && rect.top < containerRect.bottom,
  );

  if (visible.length === 0) return null;

  // Once a heading has reached the top edge it remains the active section until
  // the next heading reaches that edge. If none has reached it yet, use the
  // first heading visible in the viewport.
  const reachedTop = visible.filter(
    ({ rect }) => rect.top <= containerRect.top,
  );

  return reachedTop[reachedTop.length - 1]?.heading ?? visible[0].heading;
}

export function findPostOutlineHeadingAtSelection(
  editor: Editor,
  headings: PostOutlineHeading[],
): PostOutlineHeading | null {
  const selectionPosition = editor.state.selection.from;
  let previous: PostOutlineHeading | null = null;

  for (const heading of headings) {
    const node = editor.state.doc.nodeAt(heading.position);
    if (!node) continue;

    if (
      selectionPosition >= heading.position &&
      selectionPosition < heading.position + node.nodeSize
    ) {
      return heading;
    }

    if (selectionPosition < heading.position) break;
    previous = heading;
  }

  return previous;
}

/**
 * Trasporta la posizione dell'heading attivo attraverso una transazione:
 * le voci precedenti che si spostano non fanno perdere il riferimento, senza
 * dover persistere un identificatore nel contenuto.
 */
export function mapPostOutlineHeadingThroughTransaction(
  heading: PostOutlineHeading | null,
  transaction: Transaction,
  nextHeadings: PostOutlineHeading[],
): PostOutlineHeading | null {
  if (!heading) return null;

  const mappedPosition = transaction.mapping.mapResult(heading.position, 1);
  if (mappedPosition.deleted) return null;

  // Mapping the position of the node start lets the active entry survive
  // insertions/removals before it without persisting an identifier in content.
  return (
    nextHeadings.find(
      (nextHeading) => nextHeading.position === mappedPosition.pos,
    ) ?? null
  );
}

/**
 * Scrolls the editor's own viewport rather than the page. The fallback keeps
 * this usable with regular scroll containers and older browser implementations
 * that do not expose scrollTo on the element.
 */
export function scrollPostOutlineHeadingIntoView(
  editor: Editor,
  heading: PostOutlineHeading,
): void {
  const element = getHeadingElement(editor, heading);
  if (!element) return;

  const container = getPostOutlineScrollContainer(editor);
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const targetTop = container.scrollTop + elementRect.top - containerRect.top;

  if (typeof container.scrollTo === "function") {
    container.scrollTo({
      top: targetTop - POST_OUTLINE_STICKY_NAV_OFFSET,
      behavior: "smooth",
    });
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "start" });
}