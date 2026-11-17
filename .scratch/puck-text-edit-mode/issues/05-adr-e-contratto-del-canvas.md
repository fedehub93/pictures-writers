# 05: ADR e contratto del canvas aggiornati

**What to build:** Il progetto registra il fatto misurato: un blocco testo ha due stati, e il drag
dipende da un lock CSS che deve coprire l'overlay portal. L'ADR nuovo racconta il perché della
scelta e cita la spike; ADR-0041 smette di affermare che l'editor inline non tocca drag e selezione;
la checklist di upgrade del canvas guadagna i passi di drag e di modalità modifica, che oggi mancano
del tutto — è il buco per cui il difetto è passato inosservato.

**Blocked by:** 04

**Status:** done

**Skills:** `docs/agents/domain.md`, indice in `docs/adr/README.md`; `docs/puck-canvas.md`.

- [x] Un ADR nuovo registra: i due stati, perché il lock deve coprire i discendenti del portal, perché
      i listener sono nativi e non React, perché `Esc` è nostro, e il costo accettato del click lento
      che diventa drag. Cita la spike e i riferimenti al sorgente di Puck.
- [x] ADR-0041 è corretto nel punto che dava per scontati drag e selezione, con un rimando all'ADR
      nuovo invece di una riscrittura.
- [x] L'indice degli ADR è aggiornato.
- [x] `docs/puck-canvas.md`: la sezione sull'editing inline descrive i due stati e la checklist di
      upgrade contiene un passo per il drag e un passo per la modalità (doppio click, caret, `Esc`,
      toolbar che si smonta).
- [x] Il glossario è verificato rispetto al lavoro svolto: **Text editing mode**, **Locked text
      block** e il rimando da **Inline text editing** corrispondono a come il codice si comporta.
- [x] Il commento in testa al wrapper del gate spiega quale regola di Puck sta compensando, così che
      un upgrade che la cambia trovi qualcuno che se ne accorge.

## Comments

**2026-11-13 — commit `5d58c49d`** (`docs(puck): record the two text block states`).

Cosa è cambiato:

- `docs/adr/0042-text-editing-mode-and-the-canvas-lock.md`: l'ADR nuovo. Raccoglie i due stati, il
  fatto misurato (il portal che riempie il Block root e `[contenteditable]` che dnd-kit rifiuta), il
  perché del lock sui discendenti, i listener nativi, `Esc` nostro, il grip durante la modalità e il
  costo del click lento; cita `spike/FINDINGS.md` e i percorsi di Puck per sezione.
- `docs/adr/0041-inline-text-editing-in-puck-blocks.md`: lo status porta la revisione e il bullet su
  `inline`/`dragRef` smette di dare per scontati drag e selezione, con il rimando a 0042. Il resto
  dell'ADR non è riscritto.
- `docs/adr/README.md`: le righe di 0041 (revisionata) e 0042 nell'indice.
- `docs/puck-canvas.md`: sezione **Inline text editing** con i due stati, l'attributo
  `data-text-editing`, il lock in `puck-base.css` §7, l'uscita con focus consegnato a Puck e la
  toolbar legata allo stato; la checklist di upgrade apre con seleziona-senza-caret, drag dal testo,
  doppio click/`Invio`/grip e `Esc` doppio. La lista "Read these in order" cita 0042.
- `GLOSSARY.md`: **Text editing mode**, **Locked text block** e il rimando da **Inline text editing**
  verificati sul codice; **Block toolbar** corretto (i controlli ci sono in modalità, non "col
  focus"), e la toolbar è descritta come visibile quando l'editor ha il focus (dopo un drag dal grip
  il blocco resta armato ma il focus è uscito).
- `src/puck/editor/text-edit-mode/text-edit-gate.tsx`: il commento del wrapper nomina la regola di
  Puck che il gate compensa (`pointer-events: auto !important` sul portal e sui discendenti) e dice
  cosa ri-misurare a un upgrade.
- `src/puck/editor/text-edit-mode/editor-dnd.ts` + `src/puck/editor-shell.tsx`:
  `dnd={{ enableDragHandle: true }}` era una decisione della spec (user story 14) rimasta non
  implementata — ticket 04 ne segnalava l'assenza. Il grip è l'unico drag possibile col caret vivo
  (dnd-kit rifiuta il press in `[contenteditable]`) e Puck tiene il corpo del blocco come attivatore,
  quindi il drag dal testo del blocco bloccato resta. Il test in `text-edit-action.test.tsx` asserisce
  il valore della config e che la shell la passi a `<Puck>`.

Verifiche:

- `npm run lint`: 0 errori (265 warning `no-explicit-any` preesistenti).
- `npm run typecheck`: pulito.
- `npm run test:run`: 256 file / 2241 test passati (i tre file del gate: 60 test).
- `scripts/builder-probe.mjs`, quattro run sulla pagina probe (gli step sono in
  `.scratch/puck-text-edit-mode/issues/05-probe-steps*.json`), con `npm run agent:seed` prima di
  ognuno e reset finale:
  - click sull'Heading: `armed: 0`, `caretInside: false`, `contenteditable: null`, toolbar assente,
    un solo pulsante live `Edit text` con `aria-pressed: "false"`, breadcrumb `Heading`;
  - drag dal testo (260px canvas): `hit: h2`, `insideEditor: false`, ordine
    `["Probe heading","Probe paragraph"]` → `["Probe paragraph","Probe heading"]`;
  - doppio click: `dblclick detail 2` sul `h2`, caret `contenteditable: "true"` a `anchorOffset: 7`,
    `armed: ["Probe heading"]`, toolbar montata, grip presente, pulsante `Done` `aria-pressed: "true"`;
  - drag dal grip con caret vivo: ordine invertito di nuovo, `armed` ancora sull'Heading; il drag
    porta via il focus (`activeTag: BODY`, toolbar assente), e un click sul testo riporta
    `contenteditable: "true"`, caret e toolbar;
  - primo `Esc`: `armed: 0`, toolbar assente, `activeTag: H2`, selezione collassata, breadcrumb
    `Heading`; secondo `Esc`: breadcrumb `null`;
  - `Invio` su blocco selezionato: `armed`, caret dentro l'editor; click sul Text: modalità chiusa,
    breadcrumb `Text`;
  - pulsante (selettore limitato all'overlay del blocco selezionato): `Done` → caret dentro e
    `aria-pressed: "true"`; `type " plus"` scrive `[data-text-editing] .ProseMirror` →
    `<p>Probe heading plus</p>`; `Done` → `armed: 0`, toolbar assente, focus sull'`H2`, selezione
    collassata, pulsante `Edit text`, blocco ancora selezionato;
  - formattazione: `Ctrl+A`, `Ctrl+B`, `Ctrl+I`, `Ctrl+U` → `<strong><em><u>Probe heading</u></em>
    </strong>`; pannello link (`input[aria-label="Link URL"]`) e pannello colore (`Custom color`)
    aperti dentro `#preview-frame` con la modalità ancora armata; `Esc` col pannello aperto chiude
    entrambi e lascia il blocco selezionato.

## Notes

- L'ADR va scritto dopo il codice, non prima: registra un fatto verificato, non un'intenzione.
- La verifica in browser che chiude il ticket è la checklist completa, non i singoli passi.
