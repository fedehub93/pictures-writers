# 06: Verifica finale

**What to build:** Tutti i ticket della feature Table sono completi e la codebase è in uno stato verdi prima del merge. L'allineamento delle versioni, il nodo Table con inserimento e comportamento tastiera, i comandi strutturali, l'interfaccia editor noto-style e il renderer pubblico sono implementati e testati. Il passo finale è una verifica integrale: lint senza errori, build completa, suite di test intera, smoke test del Puck editor, e la checklist manuale di editing e rendering pubblico su un Post e un prodotto. Nessuna regression e nessuna migrazione di database necessaria.

**Blocked by:** 04 (Notion-style table editor UI), 05 (Table public rendering)

**Status:** ready-for-agent

- [ ] `npm run lint` passa senza errori.
- [ ] `npm run build` completa senza errori.
- [ ] La suite di test completa (esistenti + nuovi) passa.
- [ ] Smoke test manuale del Puck editor non mostra regressioni.
- [ ] Checklist manuale editing completata: slash menu, toolbar Embed, menu galleggiante, "+", tastiera completa, resize, incolla HTML, 1×1.
- [ ] Checklist manuale rendering pubblico completata: tabella visibile su Post e prodotto con bordi e header corretti.
- [ ] Nessun nodo custom esistente alterato (caricamento e salvataggio invariati).