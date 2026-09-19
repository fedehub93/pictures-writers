# 03: Comandi strutturali della griglia

**What to build:** La tabella del Tiptap editor supporta le operazioni strutturali complete su righe e colonne: inserire una riga sopra/sotto, una colonna a sinistra/destra, eliminare la riga o colonna corrente, attivare/disattivare la header row (prima riga) e eliminare l'intera tabella. La griglia ha un minimo garantito 1×1: le eliminazioni di righe e colonne sono disabilitate quando resterebbe sotto tale soglia, così il documento JSON non può mai contenere una griglia vuota o non valida. Le colonne sono ridimensionabili col drag e la larghezza viene persistita nel documento, così le proporzioni sopravvivono a salvataggio e rendering pubblico.

**Blocked by:** 02 (Table node and entry points)

**Status:** ready-for-agent

- [x] Inserimento riga sopra/sotto e colonna sinistra/destra producono la struttura attesa nel documento.
- [x] Eliminazione riga/colonna funziona e si disabilita al limite 1×1.
- [x] Toggle della header row agisce sulla prima riga e round-trippa nel JSON.
- [x] Eliminazione dell'intera tabella rimuove il blocco dal documento.
- [x] Il resize delle colonne persistito (`colwidth`) resta dopo salvataggio e ricaricamento.
- [x] Test sul seam editing per tutti i comandi elencati, inclusa l'invariante 1×1.

## Verification

- `npx tsc --noEmit` clean.
- `npm run test:run`: 278/278 pass (51 in the editing seam, including 13 structural-command tests: addRowAfter/Before and addColumnAfter/Before placement, deleteRow/deleteColumn, the 1×1 limit for row and column deletion plus a mixed deletion sequence never dropping below 1×1, toggleHeaderRow acting on the first row from a data-row cursor, header-row JSON round-trip, deleteTable removing the block between sibling paragraphs, and colwidth persistence across save/reload; the merge/split commands staying absent is covered by the pre-existing "does not expose structural merge commands" test in the table-node block).
- `npm run lint`: no new issues — remaining errors/warnings are pre-existing.

## Notes

- Structural commands come from the base `@tiptap/extension-table`; issue 03 added `resizable: true` via `addOptions()` so the `columnResizing` plugin writes `colwidth` into the document on drag.
- Deletion guards (1×1 minimum) are enforced by prosemirror-tables: `deleteRow`/`deleteColumn` return `false` and do not mutate the doc at the limit, so the stored JSON can never hold an empty grid.
- The colwidth seam test injects a valid fixture (`colwidth.length === colspan` per column) and asserts it round-trips through save and reload; the actual drag interaction remains manual validation (floating menu + resize handles are issue 04).
- Drag-resize, the floating structural menu, and disabled-state surfacing at 1×1 are deferred to ticket 04 (Notion-style UI).