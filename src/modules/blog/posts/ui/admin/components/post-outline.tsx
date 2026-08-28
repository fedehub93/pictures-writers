"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import { ListTree } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

export interface PostOutlineHeading {
  id: string;
  level: 2 | 3 | 4;
  label: string;
  position: number;
}

const EMPTY_HEADING_LABEL = "Section without title";
const OUTLINE_LEVELS = new Set([2, 3, 4]);

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

function getEditorScrollContainer(editor: Editor): HTMLElement {
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
  const container = getEditorScrollContainer(editor);
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

function mapHeadingThroughTransaction(
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
    nextHeadings.find((nextHeading) => nextHeading.position === mappedPosition.pos) ??
    null
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

  const container = getEditorScrollContainer(editor);
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const targetTop = container.scrollTop + elementRect.top - containerRect.top;

  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top: targetTop, behavior: "smooth" });
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

export interface PostOutlineProps {
  editor: Editor | null;
}

export const PostOutline = ({ editor }: PostOutlineProps) => {
  const [headings, setHeadings] = useState<PostOutlineHeading[]>(() =>
    editor ? getPostOutlineHeadings(editor) : [],
  );
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const headingsRef = useRef(headings);
  const activeHeadingIdRef = useRef<string | null>(null);

  const setActiveHeading = useCallback((id: string | null) => {
    activeHeadingIdRef.current = id;
    setActiveHeadingId(id);
  }, []);

  useEffect(() => {
    headingsRef.current = headings;
  }, [headings]);

  useEffect(() => {
    if (!editor) {
      headingsRef.current = [];
      setHeadings([]);
      setActiveHeading(null);
      return;
    }

    const refresh = ({ transaction }: { transaction: Transaction }) => {
      const nextHeadings = getPostOutlineHeadings(editor);
      const previousActive = headingsRef.current.find(
        (heading) => heading.id === activeHeadingIdRef.current,
      );
      const mappedActive = mapHeadingThroughTransaction(
        previousActive ?? null,
        transaction,
        nextHeadings,
      );

      headingsRef.current = nextHeadings;
      setHeadings(nextHeadings);

      if (mappedActive) {
        setActiveHeading(mappedActive.id);
        return;
      }

      setActiveHeading(
        findPostOutlineHeadingAtSelection(editor, nextHeadings)?.id ??
          findVisiblePostOutlineHeading(editor, nextHeadings)?.id ??
          null,
      );
    };

    const updateFromSelection = () => {
      setActiveHeading(
        findPostOutlineHeadingAtSelection(editor, headingsRef.current)?.id ??
          null,
      );
    };

    const updateFromScroll = () => {
      const visibleHeading = findVisiblePostOutlineHeading(
        editor,
        headingsRef.current,
      );
      // Keep the last active section while the gap between two headings is
      // visible. On initial render, however, an unseen first heading must not
      // be marked active.
      if (visibleHeading) setActiveHeading(visibleHeading.id);
    };

    const initialHeadings = getPostOutlineHeadings(editor);
    headingsRef.current = initialHeadings;
    setHeadings(initialHeadings);
    setActiveHeading(
      findVisiblePostOutlineHeading(editor, initialHeadings)?.id ?? null,
    );

    editor.on("transaction", refresh);
    editor.on("selectionUpdate", updateFromSelection);

    const scrollContainer = getEditorScrollContainer(editor);
    scrollContainer.addEventListener("scroll", updateFromScroll, {
      passive: true,
    });
    window.addEventListener("resize", updateFromScroll);

    return () => {
      editor.off("transaction", refresh);
      editor.off("selectionUpdate", updateFromSelection);
      scrollContainer.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
    };
  }, [editor, setActiveHeading]);

  const navigateToHeading = (heading: PostOutlineHeading) => {
    if (!editor) return;

    // The first valid text position inside a heading is one position after
    // the heading's opening token. It is also valid for an empty heading.
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setTextSelection(heading.position + 1)
      .run();
    scrollPostOutlineHeadingIntoView(editor, heading);
    setActiveHeading(heading.id);
  };

  return (
    <aside className="sticky top-0 flex h-full min-h-0 flex-col rounded-xl border bg-card/50 p-4">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <ListTree className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-medium">Outline</h2>
      </div>

      {headings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No headings yet.</p>
      ) : (
        <TooltipProvider>
          <nav aria-label="Post outline" className="min-h-0 flex-1 overflow-y-auto">
            <ol className="space-y-1">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-current={
                          activeHeadingId === heading.id ? "location" : undefined
                        }
                        onClick={() => navigateToHeading(heading)}
                        className={cn(
                          "block w-full min-w-0 truncate rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          activeHeadingId === heading.id &&
                            "bg-accent font-medium text-accent-foreground",
                          heading.level === 3 && "pl-5",
                          heading.level === 4 && "pl-8",
                        )}
                      >
                        {heading.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start">
                      {heading.label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ol>
          </nav>
        </TooltipProvider>
      )}
    </aside>
  );
};
