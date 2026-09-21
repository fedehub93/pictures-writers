# 07: Responsiveness della tabella (scroll orizzontale)

**What to build:** La tabella resta leggibile su viewport strette, lato lettore pubblico e lato editor admin. Oggi il lettore comprime le colonne (`w-full` + `table-layout: auto`: una colonna con molto testo o molte colonne rendono le celle illeggibili), mentre l'editor fa l'opposto (`.tableWrapper { overflow: visible }` + `table-layout: fixed`: una tabella larga fuoriesce dal wrapper). La soluzione è un contenitore con scroll orizzontale attorno alla tabella: su desktop una tabella che ci sta continua a riempire la larghezza come oggi, quando lo spazio manca prende la sua larghezza naturale e scorre lateralmente. Nessuna configurazione per-tabella, nessun attributo nuovo, nessuna migrazione.

**Blocked by:** 04 (Notion-style table editor UI), 05 (Table public rendering)

**Status:** done

## Decisioni

### Lato lettore (renderer pubblico)

- Il renderer avvolge la `<table>` in un wrapper con scroll orizzontale (`overflow-x: auto`). Il wrapper fa parte dell'output di `renderHTML`, quindi vale identico per l'output React element e per l'output HTML string.
- Comportamento `width: max-content; min-width: 100%` sulla tabella: riempie il contenitore quando ci sta (nessuna regressione desktop sulle tabelle piccole, che restano full-width), prende la larghezza naturale e attiva lo scroll quando il contenuto (min-content di una colonna o somma delle colonne) supera il contenitore.
- Le larghezze colonna persistite (`colwidth`) restano rispettate. Nota implementativa: il renderer oggi emette `width: <px>` quando esistono `colwidth`, e quel valore inline vince sulle regole del wrapper; l'agente deve riconciliare l'inline width con la regola "riempi quando ci sta, scorri quando non ci sta" (es. preferire `min-width` invece di forzare `width`, senza perdere le proporzioni salvate).
- Affordance di scroll: **solo** una scrollbar sottile stilizzata e coerente col tema. Niente gradienti di bordo, niente overlay/hint una tantum. La tabella resta focusabile e la scrollbar nativa resta l'indicatore universale per assistive technology.

### Lato editor (admin)

- Lo scroll non può vivere direttamente su `.tableWrapper`: il drag handle (`.table-block-drag-handle`) è posizionato **fuori** dal bordo sinistro del wrapper (`left: 0; transform: translateX(-16px)`), quindi un `overflow-x: auto` sul wrapper lo taglierebbe.
- Soluzione: un **layer di scroll interno al wrapper**. `TableBlockView` (`extensions/table/table-view.ts`) incapsula la tabella in un `div` scrollabile (`overflow-x: auto`) tenendo il drag handle e i knob "+" sul wrapper esterno. La modifica è strutturale (DOM non-React), non comportamentale.
- I knob "+" del `TableMenu` restano ancorati al rect del wrapper (che è lo scroll container): il loro posizionamento li tiene pinnati al bordo visibile, quindi non serve clamping aggiuntivo. Verificare in ogni caso che i due "+" (colonna a destra, riga sotto) restino raggiungibili quando la tabella è scorrevole.
- Le celle mantengono `table-layout: fixed` e `colwidth`: in editor le colonne non si comprimono, cambia solo che non fuoriescono più dal wrapper.

## Note di testing

- Seam rendering (`table-rendering.test.tsx` o file affiancato): l'output HTML string e quello React element contengono il wrapper di scroll con la `<table>` all'interno; il roundtrip documento invariato resta verde.
- Il comportamento di overflow reale (scroll effettivo, larghezza naturale) è resa visuale: validazione manuale, coerente col pattern dei ticket 04/05 e con la spec (nessun test legato a classi CSS o layout del browser).
- Seam editing invariato: i comandi strutturali e il roundtrip non cambiano.

## Checklist

- [ ] Lato lettore, una tabella con tante colonne scorre orizzontalmente e le colonne restano leggibili (nessuna compressione) — **validazione manuale da eseguire**.
- [ ] Lato lettore, una colonna con molto testo non comprime le altre oltre il min-content — **validazione manuale da eseguire**.
- [ ] Lato lettore, una tabella piccola resta full-width su desktop (nessuna regressione rispetto all'attuale `w-full`) — **validazione manuale da eseguire**.
- [x] Le `colwidth` persistite restano rispettate nel rendering pubblico (rendering test: `min-width: max(100%, Npx)` + larghezze per colonna).
- [x] La scrollbar è sottile e coerente col tema; nessun fade/hint aggiuntivo (utility `post__table-scroll` con scrollbar webkit 6px e `scrollbar-width: thin`).
- [ ] In editor, una tabella larga non fuoriesce più dal `.tableWrapper` ma scorre nel layer interno — **validazione manuale da eseguire** (test strutturale del DOM verde).
- [ ] In editor, drag handle e entrambi i knob "+" restano visibili e usabili con la tabella scorrevole — **validazione manuale da eseguire**.
- [x] Test del seam rendering aggiornati/passanti; roundtrip documento invariato.
- [x] `npm run lint` senza nuovi finding; `npx tsc --noEmit` pulito.

## Verification

- Lato lettore: `TableNodeRenderer` avvolge la tabella in `["div", { class: "post__table-scroll" }, ...]` dentro `renderHTML`, quindi il wrapper è identico nell'output React element e in quello HTML string. Sulla `<table>` partono `width: max-content` (utility `w-max`) e `min-width` inline `max(100%, Npx)` al posto del vecchio `width: Npx`, così le `colwidth` persistite restano proporzionate e lo scroll scatta solo quando lo spazio manca.
- Affordance: utility `post__table-scroll` in `home.css` e `admin.css` — solo scrollbar sottile (webkit 6px, `scrollbar-width: thin`, colori di tema), nessun fade/hint.
- Lato editor: `TableBlockView` crea un layer interno `.table-scroll-layer` (`overflow-x: auto`) e ci sposta la `<table>`; drag handle e knob "+" restano fuori dal layer (per il handle sul wrapper esterno, per i knob perché `tableWrapperAt` ora restituisce il layer, il cui rect è il bordo visibile). Celle con `table-layout: fixed` e `colwidth` invariate.
- Test: `table-rendering.test.tsx` aggiornato (9 test, incluse le due nuove asserzioni sul wrapper e `min-width: max(100%, …)`), roundtrip invariato; nuovo `table-view.test.ts` (happy-dom) che verifica la struttura DOM del layer di scroll.
- `npm run test:run`: 37 file, 314 test, tutti passanti; `npx tsc --noEmit` pulito; `npm run lint` senza nuovi finding rispetto alla baseline pre-esistente (73 errori / 321 warning).
- Restano da validare manualmente i punti visuali: scroll reale su viewport stretto (lettore), nessuna compressione oltre il min-content, tabella piccola full-width, tabella larga in editor che scorre nel layer, raggiungibilità dei knob "+" con tabella scorrevole.

## Out of scope (da 06/spec)

- Layout "righe impilate a card" e qualsiasi modalità per-tabella.
- Modifica del formato JSON o migrazione del database.
