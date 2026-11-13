# 03: Ciclo di vita della modalità modifica

**What to build:** La modalità modifica si chiude quando deve e non lascia stato dietro. `Esc` esce e
tiene il blocco selezionato, un secondo `Esc` deseleziona. `Invio` sul blocco selezionato e non armato
entra in modalità. Cliccare un altro blocco, il fondo della pagina o passare all'anteprima interattiva
chiude la modalità. Uscendo, la toolbar inline sparisce davvero e nessun blocco cancellato o annullato
resta armato.

**Blocked by:** 02

**Status:** done

**Skills:** `.agents/skills/puck`; `docs/puck-canvas.md`.

- [x] `Esc` con un blocco in modalità esce dalla modalità e lascia il blocco selezionato; un secondo
      `Esc` deseleziona. Con nessun blocco selezionato `Esc` non fa nulla.
- [x] `Invio` con un blocco testo selezionato e non armato entra in modalità; con il caret già nel
      testo non viene intercettato.
- [x] Cliccare un altro blocco, il fondo della pagina o un altro blocco testo chiude la modalità del
      precedente.
- [x] Cambiare preview mode chiude la modalità.
- [x] Uscendo, la toolbar di formattazione si smonta: il focus non resta nell'editor senza un
      `relatedTarget` valido, che è l'unico caso in cui Puck azzera lo stato del richtext.
- [x] Uscendo, la selezione DOM dentro l'editor viene collassata: nessun testo resta evidenziato
      senza toolbar accanto.
- [x] Se il blocco armato non esiste più nel documento (cancellazione, undo, cambio pagina) lo stato
      si azzera da solo.
- [x] Montare l'editor azzera ogni stato ereditato da una sessione precedente nella stessa tab.
- [x] Test: le transizioni del wrapper sul blocco (doppio click, `Invio`, `Esc` primo e secondo,
      click altrove) e l'assenza dell'attributo dopo l'uscita, con il prior art di
      `inline-roots.test.tsx`.
- [x] Verifica in browser col probe: `Esc` che chiude la modalità e lascia il blocco selezionato,
      secondo `Esc` che deseleziona, toolbar assente dopo l'uscita.

## Comments

**2026-11-13 — commit `62712019`** (`feat(puck): end text editing mode on Escape and when the block
is left`).

Cosa è cambiato:

- `src/puck/editor/text-edit-mode/text-editor-dom.ts`: il DOM dell'editor — caret dal punto o a fine
  testo, focus sul Block root, selezione collassata, hand-back a Puck, guardia sull'`Invio` dei
  controlli — separato dal wrapper.
- `src/puck/editor/text-edit-mode/text-edit-gate.tsx`: `Esc` e `Invio` sono listener nativi sul
  documento del canvas (Puck non ha handler per nessuno dei due); `Esc` con il blocco armato esce e
  lascia la selezione, il secondo deseleziona via `setUi`; `Invio` con il blocco selezionato e
  bloccato entra in modalità col caret in fondo; un `pointerdown` fuori dal blocco (azione bar e
  pannelli esclusi) e un cambio di selezione chiudono la modalità. Lo stesso handler `keydown` è
  montato anche sul documento host: il canvas è un iframe e i tasti non lo attraversano, quindi `Esc`
  funziona anche quando il focus è nei pannelli.
- `src/puck/editor/text-edit-mode/selection-bridge.tsx` + `text-edit-mode-provider.tsx` +
  `use-text-edit-lifecycle.ts`: lo stato di sessione ha una sola fonte e un solo posto per le regole
  che non sono del blocco. Il provider (montato dall'editor shell, sopra il canvas) azzera lo stato
  al mount, esce al cambio di preview mode e quando il blocco armato non è più nel documento
  (`documentHasBlock` cammina contenuto, slot e zone). I blocchi ricevono selezione e `deselect`
  tramite un bridge stabile con sottoscrizione: un cambio di selezione chiude la modalità senza
  ri-renderizzare il blocco.
- `src/puck/editor/ui/components/preview-toggle.tsx`: il toggle esce dalla modalità **prima** di
  scambiare il canvas. È l'unico punto in cui si può ancora consegnare l'editor a Puck: con il
  blocco smontato non c'è più un editor da sfocare, e un evento `focusout` sintetico su un sottoalbero
  in cancellazione non arriva a React (verificato: la variante con `useLayoutEffect` non funziona).
- `src/puck/editor/ui/view/editor.tsx`: il provider avvolge il layout dell'editor.
- `src/puck/__tests__/text-edit-gate.test.tsx` (+12 test) e
  `src/puck/__tests__/text-edit-lifecycle.test.tsx` (10 test), con il bridge finto in
  `__tests__/helpers/text-edit-selection.ts`.

Verifiche:

- `npm run lint`: 0 errori (11 warning `no-explicit-any` nei file Puck, stile preesistente).
- `npm run typecheck`: pulito.
- `npm run test:run`: 255 file / 2217 test passati.
- `scripts/builder-probe.mjs` con `--steps .scratch/puck-text-edit-mode/issues/03-probe-steps.json`:
  - doppio click sull'Heading: `armed: ["Probe heading"]`, `toolbar: true`, caret nel testo a
    `anchorOffset: 8`;
  - primo `Esc`: `armed: []`, `toolbar: false`, `activeTag: "H2"` (focus sul Block root),
    `selectionCollapsed: true`, breadcrumb `"Heading"` (selezione mantenuta);
  - secondo `Esc`: breadcrumb `null`, `Page settings` attivo (deselezionato);
  - click sull'Heading + `Invio`: `armed: ["Probe heading"]`, `toolbar: true`, caret collassato
    dentro l'editor;
  - con l'Heading armato, click sul Text: `armed: []`, `toolbar: false`, breadcrumb `"Text"`;
  - con l'Heading armato, press sul fondo della pagina (canvas 10,300): `armed: []`,
    `toolbar: false`, breadcrumb `"Heading"`;
  - con l'Heading armato, focus su un bottone dell'header e `Esc`: `armed: []`, `toolbar: false`,
    breadcrumb `"Heading"` (l'`Esc` sull'host chiude la modalità e recupera la toolbar rimasta
    montata quando il focus è uscito dall'iframe).

Note:

- La lettura del ticket "cliccare il fondo della pagina" ha richiesto un listener diretto sul
  `pointerdown`: nel canvas iframe il click sul fondo non passa da Puck, quindi la selezione non
  cambia e il bridge non avrebbe nulla da notificare.
- L'esenzione per `[data-puck-overlay]`/`[data-puck-rte-menu]` copre la action bar e i pannelli di
  formattazione: sono chrome di editor portallata fuori dal Block root. Il blocco armato è sempre
  quello selezionato, quindi un press sulla chrome non sposta la selezione e la modalità resta
  coerente.
- Limite noto: un blocco rimosso da undo e riportato da redo può far riemergere il
  `currentRichText` di Puck (lo stato del richtext non è nostro e non è cancellabile senza editor
  montato). Il ticket 04, con l'override dell'action bar, è il posto in cui rendere la toolbar
  condizionata allo stato armato e chiudere anche quel caso.
- `docs/puck-canvas.md` e ADR-0041 descrivono ancora il comportamento precedente al gate: la loro
  revisione è il ticket 05 (segnalato dalla review come fuori scope qui).

## Notes

- Puck non ha nessun handler `Escape`: la deselezione del secondo `Esc` è nostra e passa dallo store
  dell'editor di Puck. Non esiste un comportamento da scavalcare, quindi non serve intercettare in
  capture per difendersi da Puck.
- Il blur da solo non deve chiudere la modalità: il focus va nel pannello link o colore, e chiudere lì
  smonterebbe la toolbar a metà formattazione.
