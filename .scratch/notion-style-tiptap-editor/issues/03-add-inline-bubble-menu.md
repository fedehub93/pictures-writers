# 03: Aggiungere bubble menu per la formattazione inline

**What to build:** Quando l'autore seleziona del testo nel Tiptap editor, deve comparire un menu contestuale leggero con le azioni inline più frequenti.

**Blocked by:** 01: Stabilizzare il writing surface Tiptap.

**Status:** ready-for-human

- [ ] Il bubble menu appare solo per una selezione testuale non vuota.
- [ ] Il menu contiene bold, italic, underline e link.
- [ ] Gli stati attivi riflettono mark e link della selezione corrente.
- [ ] L'azione link continua a usare il modal e il mark custom già esistenti.
- [ ] Il menu non include media, allineamento, liste o trasformazioni strutturali.
- [ ] Le interazioni mouse non fanno perdere accidentalmente la selezione prima dell'azione.
- [ ] Dopo un'azione il focus torna all'editor.
- [ ] Il bubble menu viene posizionato correttamente anche vicino ai bordi della viewport e su selezioni lunghe.
- [ ] I controlli espongono label accessibili e stato selezionato.
- [ ] La validazione manuale copre desktop, tablet e viewport stretta.
- [x] Sono eseguiti lint e test pertinenti.

## Comments

Implemented:
- `src/shared/components/tiptap-editor/bubble-menu/bubble-menu.tsx` renders the Tiptap `BubbleMenu` with bold, italic, underline and an optional link slot. Active states are reactive via `useEditorState`, positioning uses `flip`/`shift`/`inline` and an `updateDelay` of 250 ms.
- `src/modules/blog/posts/ui/admin/components/link-button-bubble.tsx` provides the blog-specific link control: toggles the link mark off when active, otherwise opens the existing `editLink` modal and reuses `setLinkMark` / `updateLinkMark`. Selection is captured before the modal opens and restored in the save callback so the link is applied to the original range.
- `src/shared/components/tiptap-editor/bubble-menu/bubble-menu-utils.ts` exports `shouldShowBubbleMenu`, which hides the menu for empty selections, non-editable editors and node selections.
- `src/shared/components/tiptap-editor/mark-button.tsx` now requires an accessible `label` prop; labels were added to all existing toolbar consumers.
- The shared `Tiptap` shell and `GenericTiptapV2` expose `bubbleMenu` and `linkButton` props so consumers can opt in or provide their own link action, keeping admin modal orchestration out of shared infrastructure. The blog post form opts in with `bubbleMenu` and supplies the blog-specific link button.
- `@tiptap/extension-bubble-menu` was added as an explicit dependency.

Automated tests in `bubble-menu.test.ts` cover the visibility predicate and the inline formatting commands against the production extension seam.

Manual validation checklist (to be verified in browser):
- [ ] Bubble menu appears on text selection in desktop viewport.
- [ ] Bubble menu is usable on tablet viewport (touch targets, no clipping).
- [ ] Bubble menu repositions correctly near viewport edges and on long multi-line selections.
- [ ] Selection is preserved when clicking a bubble menu control.
- [ ] Focus returns to the editor after applying formatting or saving a link.
