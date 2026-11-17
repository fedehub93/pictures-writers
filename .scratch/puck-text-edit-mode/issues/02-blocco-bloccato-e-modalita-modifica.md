# 02: Blocco testo bloccato e modalità modifica col doppio click

**What to build:** Un blocco testo si comporta come qualunque altro blocco finché non lo si apre. Il
click seleziona, il press prolungato con movimento trascina e riordina, nessun caret entra nel testo.
Il doppio click apre la modalità modifica col caret sulla parola cliccata e la toolbar di
formattazione montata. Aprendo un secondo blocco il primo si chiude: uno solo per volta.

Il ticket esiste perché oggi il testo occupa tutta la superficie del Block root e il blocco non si
può trascinare; chiuderlo senza un modo per scrivere dentro il testo sarebbe una regressione, quindi
blocco e ingresso in modalità arrivano insieme.

**Blocked by:** 01

**Status:** done

**Skills:** `.agents/skills/puck`; `docs/puck-canvas.md`; ADR-0040, ADR-0041.

- [x] Lo stato di sessione dell'editor ospita l'id del blocco in modalità modifica, con ingresso e
      uscita; non è persistito e non tocca il documento Puck.
- [x] Il wrapper del gate è applicato solo alle config dell'editor dei due blocchi testuali: il render
      condiviso e la config pubblica non lo conoscono, e il bundle pubblico non guadagna né lo store
      né i listener.
- [x] Con il blocco bloccato la zona editabile non riceve il puntatore: il click seleziona il blocco
      senza mettere il caret, e nessun `pointerdown` raggiunge l'editor.
- [x] Con il blocco bloccato un press prolungato con movimento trascina il blocco e lo riordina, come
      su ogni altro blocco del canvas.
- [x] Il doppio click sul blocco entra in modalità modifica, il caret cade sulla parola cliccata e la
      toolbar inline compare nell'action bar.
- [x] Il passaggio da bloccato a modalità avviene senza re-render: nessun rimontaggio dell'editor,
      nessun salto del layout.
- [x] Il markup a riposo è identico a quello della pagina pubblicata: l'attributo che segnala la
      modalità esiste solo da armato e la pagina non lo vede mai.
- [x] Le regole CSS del gate coprono anche i discendenti dell'overlay portal e battono la regola
      `!important` di Puck; una di esse rimossa fa fallire un test.
- [x] Le regole raggiungono l'iframe del canvas dal foglio di stile del progetto, non solo da un CSS
      iniettato a mano.
- [x] Un blocco testuale aggiunto in futuro eredita il comportamento senza essere registrato a mano.
- [x] Verifica in browser col probe del ticket 01: click che seleziona senza caret, trascinamento che
      riordina, doppio click che apre il caret sulla parola giusta.

## Comments

**2026-11-13 — commit `f30de93b`** (`feat(puck): lock text blocks until a double click opens the
editor`).

Cosa è cambiato:

- `src/puck/editor/store/use-editor-store.ts`: `editingTextBlockId` con `enterTextEditMode` /
  `exitTextEditMode`. Stato di sessione, uno solo per volta, niente persistenza e niente Puck data.
- `src/puck/editor/text-edit-mode/text-edit-gate.tsx`: `withTextEditGate` compone `puck.dragRef`,
  ascolta `dblclick` nativo sul Block root, arma lo store e mette il caret con
  `caretRangeFromPoint` + `focus()` (fallback a fine testo) — il punto è risolto prima del focus,
  come in spike. L'attributo `data-text-editing` è scritto da una sottoscrizione allo store, non da
  React: armare non ri-renderizza il blocco. `hasInlineRichTextField` legge il descrittore dei
  `fields` (non una lista di nomi), quindi un futuro blocco testuale eredita il gate;
  `gateTextBlocks`/`gateEditorConfig` sono le uniche viste sul registry.
- `src/puck/editor-shell.tsx`: il gate è applicato qui, con `useMemo` sulla config. Dopo la review ho
  spostato l'applicazione fuori da `config.ts`: il registry condiviso (e la config pubblica) resta
  senza runtime dell'editor, e l'unico import di `useEditorStore` e del listener vive nel grafo
  client dell'editor. `config.ts` guadagna solo il commento che registra dove vive il gate.
- `src/puck/styles/puck-base.css` §7: il lock copre `[data-puck-overlay-portal]` **e i suoi
  discendenti** con `!important`; la regola armata li riabilita. Il commento spiega perché il lock
  deve coprire i discendenti (Puck forza `auto !important`), che la regola del drag in corso pareggia
  la specificità e che le due dichiarazioni sono byte inerti nel bundle pubblico (nessun attributo,
  nessun markup, nessun JS cambia).
- `src/puck/__tests__/text-edit-gate.test.tsx`: 17 test sul seam del wrapper (doppio click, caret,
  fallback, un blocco per volta, uscita, nessun re-render e stessa istanza dell'editor), sulla parità
  di markup a riposo contro `pageRenderConfig`, sulla purezza del registry condiviso e sulle due
  regole CSS asserite una per selettore con l'helper `css-rules.ts` — rimuoverne una fa fallire il
  test. Un test lega il foglio alla `layout.tsx` admin, che è ciò che Puck rispecchia nell'iframe.

Verifiche:

- `npm run lint`: 0 errori (255 warning, di cui 11 nuovi `no-explicit-any` dal tipo di Puck).
- `npm run typecheck`: pulito.
- `npm run test:run`: 254 file / 2198 test passati.
- `npm run build`: completata.
- `scripts/builder-probe.mjs` su pagina probe dell'ambiente agent (`agent:seed`), tre run:
  - click sull'Heading: `activeTag: "H2"`, `contenteditable: null`, `rangeCount: 0`, `armed: false`,
    `toolbar: false`;
  - drag dal testo: `from.hit = { tag: "h2", insideEditor: false, insideOverlayPortal: false }`,
    ordine `["Probe heading","Probe paragraph"]` → `["Probe paragraph","Probe heading"]`;
  - doppio click **a freddo** (primo gesto della pagina): `event = { type: "dblclick", detail: 2,
    target: "h2", connected: true, inContenteditable: false }`, caret `contenteditable: "true"`,
    `anchorNode.textContent: "Probe heading"`, `anchorOffset: 8`, toolbar `Bold, Italic, Underline,
    Add link, Text color` presente;
  - click sull'editor armato: `activeElement` contenteditable; doppio click sul Text: resta un solo
    `[data-text-editing]` (`"Probe paragraph"`).

Note:

- La review ha proposto di spostare il gate da `config.ts` all'editor shell (fatto) e ha segnalato
  che `docs/puck-canvas.md` e ADR-0041 descrivono ancora il vecchio comportamento: la loro revisione
  è il ticket 05, insieme alla checklist di upgrade. Il glossario era già modificato prima di questo
  ticket e non è stato toccato.
- `Esc`/`Invio`, la chiusura su click altrove e il pulsante **Edit text** restano ai ticket 03 e 04.
  Il remount di un blocco rilegge l'id armato dallo store: è voluto, perché lo store resta la sola
  fonte di verità finché il ticket 03 non azzera lo stato al mount dell'editor.

## Notes

- La cascata del blocco e dell'armamento è una sola cosa: un lock che non copre i discendenti del
  portal non blocca nulla (Puck li riabilita con `!important`), e un lock che li copre rende il testo
  una maniglia di trascinamento — che è il comportamento voluto. Non separare le due regole.
- Il caret si calcola sul punto del doppio click prima del focus: misurato esatto in spike, con
  fallback a fine testo.
- Conseguenza accettata: un click lento può iniziare un drag. È la regola di dnd-kit già in vigore su
  ogni altro blocco.
