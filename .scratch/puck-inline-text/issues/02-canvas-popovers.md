# 02: Popover di link e colore dentro il canvas

**What to build:** I controlli di link e colore della toolbar inline devono aprirsi **dentro
l'iframe del canvas**. Oggi `LinkPickerPopover` e `ColorPickerPopover` usano il portal di Radix, che
finisce nel `document.body` della finestra padre: il pannello si apre fuori dal frame, alle
coordinate sbagliate. I due componenti ricevono un container esplicito e lo passano al portal, così
il pannello vive nel documento dell'iframe, sopra la toolbar. Entrambi vengono aggiunti a
`renderInlineMenu`; il `renderMenu` della sidebar resta per ora (viene rimosso nel ticket 05).

**Blocked by:** 01

**Status:** done

**Skills:** `.agents/skills/puck` (progetto), `shadcn` (globale), `tiptap` (globale).

- [x] `LinkPickerPopover` e `ColorPickerPopover` accettano il container del documento in cui
      renderizzano e lo passano al portal.
- [x] Il container corretto è il `document.body` dell'iframe del canvas quando si è nell'editor, e
      il documento corrente quando il menu è in sidebar (finché esiste).
- [x] I due controlli sono montati in `renderInlineMenu` e funzionano dal canvas: aprire il popover,
      applicare, rimuovere, "apri in nuova scheda" per il link.
- [x] Il colore continua a funzionare su selezione e a mostrare il colore corrente.
- [x] Test: i componenti inoltrano il container al portal; nessun test che dipenda dal
      posizionamento di Radix.
- [x] Browser probe (`node scripts/browser-probe.mjs --frame preview-frame`): apertura del popover
      dentro il frame, ancoraggio alla toolbar, click su un colore e su "Apply".

## Notes

- Questo è il ticket che decide se link e colore possono vivere solo nella toolbar: il ticket 05
  nasconde il campo dalla sidebar solo dopo che questo è verificato in browser.
- La toolbar inline vive nella action bar, che Puck portala già nel body dell'iframe: il container
  del popover deve essere quello, non `document.body` della finestra.
- Il pannello è portato fuori dalla toolbar, quindi porta lui `data-puck-rte-menu`: senza il
  marcatore, quando il focus passa all'input del link Puck crederebbe che l'editor abbia perso il
  focus e smonterebbe la toolbar (e con lei il popover).

## Comments

- 2026-11-12 — Implementato.

  Cambi:
  - `PopoverContent` (`src/shared/ui/popover.tsx`) accetta `container` e lo passa a
    `PopoverPrimitive.Portal`; l'omissione resta il body del documento corrente.
  - `LinkPickerPopover` e `ColorPickerPopover` ricevono `container: HTMLElement | null` e lo
    inoltrano al portal; il pannello porta `data-puck-rte-menu` per il contratto di focus di Puck.
  - `getRichTextMenuPortalContainer(editor)` in `src/puck/fields/rich-text/index.tsx` legge il body
    del documento dell'editor: iframe nel canvas, finestra dell'editor in sidebar. Il menu lo passa
    a entrambi i controlli, sia da `renderInlineMenu` sia da `renderMenu`.
  - I colori del pannello hanno nome accessibile e `aria-pressed` sullo swatch corrente; il trigger
    ha `aria-label`. Il trigger del colore è ora un componente client esplicito.
  - Nuovo `src/puck/__tests__/rich-text-popovers.test.tsx`: il container arriva al portal, link
    applicato/rimosso, `target`/`rel` scritti solo con "Open in new tab", colore applicato e stato
    corrente. Nessuna asserzione sul posizionamento di Radix.

  Verifiche:
  - `npm run typecheck` pulito.
  - `npm run lint` sui file toccati: pulito.
  - `npm run test:run`: 251 file / 2137 test verdi.
  - Probe su `/admin/pages/<about>/builder/`, frame `preview-frame`, finestra 1440×1000:
    - link: pannello nel documento dell'iframe (`topHasLinkPanel: false`), sotto la toolbar
      (top 199 contro bottom 197), `Apply` ha prodotto `<a href="https://example.com/lab">`,
      `Open` ha aperto una nuova scheda sullo stesso href, `Remove` ha tolto il link;
    - colore: pannello nel frame, sotto la toolbar; click su `#ef4444` ha prodotto
      `style="color: rgb(239, 68, 68)"` sulla selezione;
    - zero eccezioni e zero errori in console. Screenshot dei due pannelli controllati a vista.

  Nota: `scripts/browser-probe.mjs` esegue una sola azione per run, quindi il flusso multi-step è
  stato pilotato con uno script CDP temporaneo modellato sul probe (stesse coordinate mappate
  attraverso il transform dell'iframe); non è stato committato.
