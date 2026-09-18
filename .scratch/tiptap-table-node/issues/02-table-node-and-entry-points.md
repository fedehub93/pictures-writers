# 02: Nodo Table e punti d'ingresso

**What to build:** Il Tiptap editor condiviso (Post e descrizioni prodotto) acquisisce il nodo **Table**: una griglia rettangolare costruita con la famiglia ufficiale Tiptap su prosemirror-tables. L'autore può inserire una tabella 3×3 con la prima riga header già attiva, sia dallo slash menu (comando "Table" nel gruppo Content, cercabile per keywords) sia dal menu Embed della toolbar. Le celle contengono solo rich text inline e supportano la navigazione noto-completa da tastiera: frecce e Tab/Shift+Tab tra celle, Tab/Enter sull'ultima riga che creano una nuova riga, Enter verso la cella sotto, Shift+Enter per il a capo nella cella, Esc per uscire dalla griglia. L'incolla di una tabella HTML produce un nodo Table con gli `colspan`/`rowspan` rimossi, così la griglia resta sempre rettangolare e senza celle unite. Un documento che contiene tabelle round-trippa tra le estensioni di produzione e i nodi custom esistenti continuano a caricarsi invariati.

**Blocked by:** 01 (TiPTap version alignment)

**Status:** ready-for-agent

- [x] Lo slash menu espone "Table" nel gruppo Content (label, description, keywords, icona) e il filtro la trova.
- [x] Il menu Embed della toolbar espone "Table" e l'inserimento produce una griglia 3×3 con header attivo.
- [x] La tastiera si comporta come descritto: frecce, Tab/Shift+Tab, Enter (cella sotto e nuova riga sull'ultima), Shift+Enter (a capo), Esc (uscita).
- [x] Le celle accettano solo contenuto inline rich text.
- [x] Incollando una tabella HTML con celle unite si ottiene una griglia rettangolare senza `colspan`/`rowspan`.
- [x] Un documento con Table round-trippa tra editor di produzione e JSON senza perdita semantica.
- [x] I nodi custom esistenti (immagini, video, prodotti, info box, TableContentNode) continuano a caricarsi e salvarsi invariati.
- [x] Test sul seam editing: catalogo slash menu, inserimento 3×3, comportamento tastiera, incolla con strip, roundtrip.

## Verification

- `npx tsc --noEmit` clean.
- `npm run test:run`: 265/265 pass (38 in the editing seam, including 16 table tests: slash catalog order + filter queries ("table", "grid"), 3×3 insert with header, caret in header cell, Enter→cell below, Enter on last row appends row, Shift+Enter hard break, Enter outside table unchanged, Tab next cell + row append, Shift+Tab previous cell, Escape to following block / Escape out of grid, roundtrip with custom nodes, paste normalizer via `transformPasted` seam on a real HTML-parse slice + pure `normalizeTableSlice` unit, no colspan/rowspan leak in HTML, and merge/split commands absent).
- `npm run build`: compiled successfully.
- `npm run lint`: no new issues — remaining errors/warnings are pre-existing (scripts/fix-user-uuids.cjs, src/actions, admin components, tiptap renderer/ui files).

## Notes

- `@tiptap/extension-table@^3.31.3` installed (root + subpath exports).
- New folder `extensions/table/`: `index.ts` (family with structural merge commands removed via `Table.extend`), `keymap.ts` (`TableNavigationKeymap` Enter/Escape), `paste.ts` (`normalizeTableSlice` + `TablePaste` plugin with `transformPasted`).
  - `mergeCells`, `splitCell`, `mergeOrSplit`, `setCellAttribute` are excluded from the command surface so the grid can never become non-rectangular through editing (spec: "i comandi di merge/split non vengono esposti").
  - `colspan`/`rowspan` are now captured at parse time (`parseHTML`) so merged HTML tables pasted from other editors expand on paste into a rectangular grid with their content duplicated, never lost, and never serialized (`rendered: false`).
  - Cell `parseHTML` (tag `td`/`th`, incl. the base empty-cell filler) is inherited from the base cell/header nodes; `TableRow`'s `(tableCell | tableHeader)*` content spec allows headers anywhere.
  - Ragged rows/holes are padded with fresh default cells so the result is always rectangular.
- Registered last in `createProductionExtensions()` so the custom keymap wins over core Enter (core plugins are reversed before dispatch).
- Renderer twins (schema-only) intentionally NOT added here — that is ticket 05 scope; public rendering of tables will land there.