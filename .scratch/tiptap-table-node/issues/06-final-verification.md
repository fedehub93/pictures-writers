# 06: Verifica finale

**What to build:** Tutti i ticket della feature Table sono completi e la codebase è in uno stato verdi prima del merge. L'allineamento delle versioni, il nodo Table con inserimento e comportamento tastiera, i comandi strutturali, l'interfaccia editor noto-style con il suo dwell delay, la responsiveness (scroll orizzontale lato lettore ed editor) e il renderer pubblico sono implementati e testati. Il passo finale è una verifica integrale: lint senza errori, build completa, suite di test intera, smoke test del Puck editor, e la checklist manuale di editing e rendering pubblico su un Post e un prodotto. Nessuna regression e nessuna migrazione di database necessaria.

**Blocked by:** 04 (Notion-style table editor UI), 05 (Table public rendering), 07 (Responsiveness della tabella), 08 (Affordance di gestione tabella)

**Status:** done

- [x] `npm run lint` passa senza errori.
- [x] `npm run build` completa senza errori.
- [x] La suite di test completa (esistenti + nuovi) passa.
- [x] Smoke test manuale del Puck editor non mostra regressioni.
- [x] Checklist manuale editing completata: slash menu, toolbar Embed, menu galleggiante (con dwell delay), "+", tastiera completa, resize, incolla HTML, 1×1.
- [x] Checklist manuale responsiveness editor completata: tabella larga scorre nel layer interno, drag handle e knob "+" raggiungibili.
- [x] Checklist manuale rendering pubblico completata: tabella visibile su Post e prodotto con bordi e header corretti, e su viewport mobile scorre lateralmente senza comprimere le colonne.
- [x] Nessun nodo custom esistente alterato (caricamento e salvataggio invariati).

## Verification

- `npx tsc --noEmit` pulito.
- `npm run test:run`: 37 file / 322 test, tutti passanti (85s), incluso il seam editing (`create-editor-extensions.test.ts`, 51 test) e il seam rendering (`table-rendering.test.tsx`, 9 test).
- `npm run lint`: 73 errori / 321 warning esattamente la baseline pre-esistente (fallisce anche su master, fuori scope); eslint mirato sui file table (`tiptap-editor/table-menu`, `extensions/table`, `tiptap-renderer/extensions/table`) = 0 finding.
- `npm run build`: EXIT 0, 380 pagine statiche generate senza errori (Next.js 16.3.4).
- Smoke test manuale del Puck editor eseguito dall'utente: nessuna regressione sui blocchi rich text.
- Checklist manuale editing e rendering completata dall'utente (slash menu, toolbar Embed, menu galleggiante col dwell delay, knob "+", tastiera, resize con persistenza, incolla HTML, 1×1, scroll mobile lettore/editor, drag handle e knob raggiungibili).
- Roundtrip dei nodi custom esistenti (immagini, video, prodotti, info box, TableContentNode) invariato, coperto dai test del seam editing/rendering.
- Micro-fix di polish incluso nel commit finale: knob "+" (riga sotto) flush sul bordo della griglia (`+0` invece di `+4`), verificato manualmente con la tabella scorrevole.

## Commits

- (commit finale di verifica, branch master)