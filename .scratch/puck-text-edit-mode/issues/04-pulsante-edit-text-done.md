# 04: Pulsante Edit text / Done nell'action bar

**What to build:** Il blocco testo selezionato mostra **Edit text** tra le sue azioni; premuto, il
blocco entra in modalità modifica e il pulsante diventa **Done**, che ne esce. È la via scopribile per
chi non conosce il doppio click e l'unica via praticabile su touch, dove il doppio tap è dello zoom.

Il pulsante compare solo sui blocchi che hanno davvero un Content field e solo se quel campo è
editabile: su un blocco senza testo, o su uno che i permessi rendono statico, non promette nulla.

**Blocked by:** 03

**Status:** done

**Skills:** `.agents/skills/puck` (override dell'action bar); `docs/puck-canvas.md`.

- [x] Un override dell'action bar rende il pulsante quando il componente selezionato dichiara un
      Content field; il riconoscimento legge il descrittore dei campi, non una lista di tipi.
- [x] Il pulsante non compare su blocchi senza Content field né quando il campo non è editabile per
      permessi o read-only.
- [x] Il pulsante è un toggle: **Edit text** entra in modalità, **Done** ne esce, e riflette lo stato
      reale anche quando la modalità è stata aperta col doppio click o con `Invio`.
- [x] Il pulsante è raggiungibile da tastiera, ha un'etichetta accessibile e dichiara lo stato
      (`aria-pressed`).
- [x] Su touch, tap sul blocco che seleziona e tap sul pulsante che apre la modalità; nessun doppio
      tap richiesto.
- [x] La chrome esistente non cambia per gli altri blocchi: le azioni di Puck restano dove sono e
      nell'ordine in cui sono.
- [x] Test: il pulsante presente o assente secondo il componente selezionato e l'editabilità del
      campo; il toggle che riflette lo stato.
- [x] Verifica in browser: selezionare un `Heading`, premere **Edit text**, scrivere, premere
      **Done**, e ritrovare il blocco selezionato e bloccato.

## Comments

**2026-11-13 — commit `49351475`** (`feat(puck): add the Edit text toggle to the text block action
bar`).

Cosa è cambiato:

- `src/puck/editor/text-edit-mode/text-edit-action.ts`: la regola pura — se il blocco ha un'azione e
  cosa dice. `canEditText` legge il descrittore del Content field (lo stesso che legge la canvas
  transform) e nega l'azione quando il campo è read-only su quell'item o i permessi rendono il blocco
  non editabile; `textEditAction` aggiunge lo stato dall'editor store e restituisce
  `{ blockId, editing, label }`. Testo e `aria-pressed` derivano dallo stesso `editing`, quindi il
  pulsante riflette anche una modalità aperta col doppio click o con `Invio`: tutti gli ingressi
  scrivono lo stesso id.
- `src/puck/editor/text-edit-mode/text-edit-action-bar.tsx`: il primo `overrides` del progetto,
  motivato nel commento dell'export. Il bar è riprodotto gruppo per gruppo come quello di Puck
  (parent action e label, azioni del blocco, pulsante, drag handle in fondo) e il pulsante vive in un
  gruppo proprio **prima** del grip, così niente di ciò che Puck disegna si sposta e il grip resta
  all'estrema destra. Tre pezzi con tre responsabilità: `ActionBarWithTextEdit` è il markup,
  `BlockActionBar` la decisione con l'editor store (montabile nei test senza Puck),
  `TextEditActionBar` l'unica parte che legge Puck.
- L'override non riceve l'id del blocco: `label` è il nome del tipo e due Heading lo condividono.
  `selectedItem` è l'unica identità che Puck offre, ed è quella giusta perché Puck disegna il bar
  anche sui blocchi in hover ma tiene quei bar a `opacity: 0` e senza puntatore: l'unico visibile è
  quello del blocco selezionato (regola verificata nel sorgente di Puck e nel foglio di stile).
- La toolbar di formattazione è legata alla modalità: `currentRichText` di Puck sopravvive al blocco
  cancellato, quindi undo + redo riportava la toolbar su un blocco bloccato — il limite noto del
  ticket 03. Il bar non può cancellare uno stato che non possiede, quindi `.puck-text-edit-actions`
  scrive `data-text-edit-armed` solo a modalità aperta e `puck-base.css` §8 nasconde
  `[data-puck-rte-menu]` senza l'attributo; `display: contents` lascia le azioni di Puck come figli
  flex del gruppo, quindi il layout del bar non cambia (misurato in browser).
- `src/puck/editor/text-edit-mode/content-field.ts`: il descrittore dei campi estratto in un modulo
  che leggono sia il gate sia il bar, così non possono divergere su cosa è un blocco testo.
- `src/puck/editor/text-edit-mode/text-editor-dom.ts`: `focusTextEditor` (caret a fine testo) è
  condiviso con `Invio`; `findBlockRoot` raggiunge il blocco dal bar confrontando l'attributo per
  valore, mai dentro un selettore costruito.
- `src/puck/styles/puck-base.css` §8: il pulsante è l'unica azione con una parola dentro, quindi
  prende la taglia dell'etichetta per tenere l'altezza del bar.
- `src/puck/editor-shell.tsx`: il bar è installato come `overrides` di `<Puck>`, accanto alla config
  gated: è editor-only per costruzione, e nessun path di render lo vede.

Verifiche:

- `npm run lint`: 0 errori (265 warning, tutti `no-explicit-any` di stile preesistente: i nuovi
  vengono dai tipi di Puck nei moduli nuovi).
- `npm run typecheck`: pulito.
- `npm run test:run`: 256 file / 2240 test passati (23 nuovi in
  `src/puck/__tests__/text-edit-action.test.tsx`).
- `npm run build`: completata.
- `scripts/builder-probe.mjs` con `--steps .scratch/puck-text-edit-mode/issues/04-probe-steps.json`:
  - click sull'Heading: un solo pulsante live, testo `Edit text`, `aria-pressed: "false"`, toolbar
    assente, breadcrumb `Heading`;
  - click su **Edit text**: `armed: ["Probe heading"]`, pulsante `Done` con `aria-pressed: "true"`,
    toolbar montata (`button[title="Bold"]`), caret dentro l'editor (`contenteditable: "true"`,
    `caretInside: true`);
  - `type " plus"`: `.ProseMirror` legge `<p>Probe heading plus</p>`;
  - click su **Done**: `armed: []`, toolbar smontata, pulsante di nuovo `Edit text`, `activeTag: "H2"`
    (focus sul Block root), selezione collassata, breadcrumb `Heading` (blocco ancora selezionato);
  - `Esc`: deseleziona, e il pulsante sparisce perché senza selezione non c'è niente da aprire.
  - Geometria del bar armato: wrapper `display: contents`, toolbar `display: flex`, link e colore
    (26px) fra la toolbar e Duplicate/Delete (28px), `Done` 42×24 — la riga resta una sola.
  - Regola della toolbar, nel canvas iframe: con `data-text-edit-armed` presente il menu calcola
    `display: flex`; togliendo l'attributo passa a `none`; rimettendolo torna `flex`. Il foglio
    raggiunge l'iframe e il selettore morde (misura fatta a modalità aperta, sull'attributo).

Note:

- `docs/puck-canvas.md`, l'ADR e la checklist di upgrade sono il ticket 05: la sezione **Inline text
  editing** descrive ancora il solo doppio click e va aggiornata col pulsante come quarto ingresso,
  e il commento dell'override va ripreso dall'ADR.
- Il grip dell'action bar oggi non è montato perché `dnd.enableDragHandle` non è configurato in
  `editor-shell.tsx`: l'override passa comunque `dragHandle` nella posizione di Puck, quindi
  attivarlo non richiederà un'altra modifica.
- La review ha chiesto di legare la toolbar allo stato armato (fatto, sopra) e ha segnalato che il
  collegamento `selectedItem` → pulsante era verificato solo leggendo il testo di
  `editor-shell.tsx`: ora `BlockActionBar` si monta nei test con un blocco del registry, lo store e
  un Block root finto, quindi presenza, assenza e toggle sono provati; la lettura del file resta a
  pinnare l'installazione dell'override in `<Puck>`, che nessun DOM di happy-dom può montare.
- `docs/puck-canvas.md` e ADR-0041 descrivono ancora lo stato precedente al gate: ticket 05.

## Notes

- È il primo `overrides` del progetto: motivarlo nel commento del file e nell'ADR, perché apre una
  superficie che oggi non esiste.
- Il pulsante non sostituisce il doppio click: i due ingressi convivono, e il pulsante è anche la via
  d'uscita esplicita.
