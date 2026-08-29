"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";

import {
  findPostOutlineHeadingAtSelection,
  findVisiblePostOutlineHeading,
  getPostOutlineHeadings,
  getPostOutlineScrollContainer,
  mapPostOutlineHeadingThroughTransaction,
  scrollPostOutlineHeadingIntoView,
  type PostOutlineHeading,
} from "@/modules/blog/posts/lib/post-outline";

/**
 * Isola lo stato e le sottoscrizioni dell'Outline. Restituisce i dati da
 * renderizzare e l'azione di navigazione. Rimane un unico punto (il hook) a
 * scrivere su `headings` e ad aggiornare il relativo ref: non c'è bisogno di
 * un secondo effetto di sincronizzazione del ref.
 */
export function usePostOutline(editor: Editor | null) {
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
      const mappedActive = mapPostOutlineHeadingThroughTransaction(
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

    const scrollContainer = getPostOutlineScrollContainer(editor);
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

  const navigateToHeading = useCallback(
    (heading: PostOutlineHeading) => {
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
    },
    [editor, setActiveHeading],
  );

  return { headings, activeHeadingId, navigateToHeading };
}