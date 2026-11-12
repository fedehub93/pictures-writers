# 01: Campo rich text inline condiviso

**What to build:** Il campo rich text di Puck diventa un descrittore a factory, così che i due
blocchi di testo possano avere menu e `options` diverse condividendo estensioni, link mark e
comportamento del canvas. Il descrittore dichiara `contentEditable: true` in modo esplicito — il
default di 0.24 è `true`, la documentazione dice `false` — e `renderInlineMenu` diventa il menu che
Puck monta nella action bar del blocco. Il blocco `Heading` adotta la factory: un click nel testo
mette il caret e la toolbar compare in alto a destra del blocco con grassetto, corsivo e
sottolineato. Il campo resta **visibile in sidebar** in questo ticket: il `renderMenu` continua a
esistere e link e colore restano raggiungibili da lì finché non arriva il ticket 02. Nessun cambio
di markup pubblico.

**Blocked by:** —

**Status:** done

**Skills:** `.agents/skills/puck` (progetto), `tiptap` (globale). Leggere
`https://puckeditor.com/docs/api-reference/fields/richtext.md` e
`https://puckeditor.com/docs/api-reference/components/rich-text-menu.md` prima di scrivere codice.

- [x] `src/puck/fields/rich-text/index.tsx` esporta una factory di descrittori; `Heading` usa il
      preset "heading" e il canvas lo monta inline.
- [x] Il descrittore dichiara `contentEditable: true` esplicito e non si affida al default.
- [x] `renderInlineMenu` è definito e produce grassetto, corsivo, sottolineato (i `children` di
      default di Puck) più quello che serve; `renderMenu` resta per la sidebar.
- [x] Il render config pubblico (`src/puck/render-config.tsx`) resta invariato: nessun markup nuovo
      sulla pagina.
- [x] Click nel testo di un `Heading` nel canvas: caret dentro, toolbar visibile, formattazione
      applicata e persistita dopo il salvataggio. Verificato in browser e con il test manuale del
      maintainer, vedi Comments.
- [x] Test: il descrittore dichiara `contentEditable` e le `options` attese; il render del blocco è
      invariato rispetto a prima.
- [x] Browser probe (`node scripts/browser-probe.mjs --frame preview-frame`) sul builder: click nel
      testo, caret, toolbar.

## Notes

- Il comportamento è di Puck: il transform registra da solo l'overlay portal del campo, quindi non
  serve `registerOverlayPortal` nel blocco.
- L'editor inline è avvolto in un `<div>`; per ora è dentro il `<div>` root di `Heading`, quindi
  nessun problema di annidamento. Diventa rilevante nel ticket 03.

## Comments

- 2026-11-12 — Implementato e committato in `8d804c0c feat(puck): mount the heading rich text field
  inline`.

  Cambi:
  - `createRichTextField(preset)` in `src/puck/fields/rich-text/index.tsx`, con `options`,
    `renderMenu` e `renderInlineMenu` per preset; `contentEditable: true` esplicito e `link: false`
    forzato sul descrittore condiviso.
  - `richTextFields.heading` è il preset usato da `Heading`; `render-config.tsx` non cambia.
  - Il tipo di ritorno della factory è `RichtextField`, così `contentEditable` e i menu restano
    verificati dal compilatore senza cast nei test.
  - Nuovo `src/puck/__tests__/rich-text-field.test.tsx`: `contentEditable`, `options` literal,
    presenza dei due menu, uso del preset da parte di `Heading`, config pubblica invariata e markup
    del blocco invariato. `rich-text-link.test.tsx` aggiornato all'export della factory.

  Verifiche:
  - `npm run typecheck` pulito.
  - `npm run lint`: 0 errori, 243 warning preesistenti.
  - `npm run test:run`: 250 file / 2131 test verdi.
  - Browser probe sul builder (`/admin/pages/<id>/builder/`, frame `preview-frame`) sulla pagina
    `about`: click su `<p>Chi siamo</p>`, focus sul `ProseMirror` con `contenteditable="true"`,
    toolbar inline con Bold, Italic, Underline, Add link e colore; Bold applicato ha prodotto
    `<p><strong>Chi siamo</strong></p>`. Il click non ha navigato e non ci sono eccezioni.

  Nota: il salvataggio non è stato esercitato dall'agente per non modificare il contenuto della
  pagina condivisa di sviluppo; la persistenza passa dal transform `richtext` di Puck (`onChange` →
  `resolveAndReplaceData`), lo stesso percorso coperto dai test di parità canvas/pagina.

- 2026-11-12 — Test manuale eseguito dal maintainer: click nel testo di un `Heading`, caret dentro,
  toolbar visibile, formattazione applicata e persistita dopo il salvataggio. Tutti i criteri di
  accettazione sono spuntati; ticket chiuso.
