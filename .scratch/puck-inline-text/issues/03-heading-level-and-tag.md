# 03: Heading con livello e tag reale

**What to build:** Il blocco `Heading` emette un vero elemento di titolo. Un nuovo campo `level`
nella sidebar (`select` H1–H6, default **H2**) decide il tag; il root del blocco è quell'elemento e
resta lui a portare `dragRef`, `puck-dim`, `puck-typo` e le variabili di stile, quindi il contratto
del Block root non cambia. Le `options` del campo restringono lo schema a ciò che il blocco deve
poter contenere: niente heading annidati, niente liste, blockquote, code, strike, horizontal rule o
allineamento. La toolbar inline resta grassetto, corsivo, sottolineato, link e colore. Il container
del rich text acquisisce in `puck-base.css` la classe condivisa con il blocco `Text` e la
spaziatura tra paragrafi, con i margini azzerati sul primo e sull'ultimo figlio.

**Blocked by:** 01, 02

**Status:** done

**Skills:** `.agents/skills/puck` (progetto), `tiptap` (globale).

- [x] `HeadingProps` acquisisce `level` e `HEADING_DEFAULT_PROPS` il default `h2`.
- [x] Il render emette `h1`–`h6` in base a `level`, validato contro una allow-list chiusa: un valore
      mancante o non valido decade su `h2`, mai su markup arbitrario.
- [x] `dragRef`, `puck-dim`, `puck-typo` e le variabili di stile restano sull'elemento `hN`.
- [x] Le `options` disattivano `heading`, `bulletList`, `orderedList`, `blockquote`, `code`,
      `codeBlock`, `strike`, `horizontalRule`, `textAlign`; il paragrafo resta.
- [x] `render-config.tsx` usa lo stesso descrittore del campo: editor e pagina non possono divergere.
- [x] `puck-base.css`: classe condivisa del container rich text, `p + p` con margine in `em`,
      margini azzerati su primo e ultimo figlio.
- [x] Test di blocco: tag corretto per ogni livello, fallback su `h2`, root con le classi e le
      variabili attese.
- [x] Il render pubblico non cambia per le altre proprietà (dimension, typography, layout).
- [x] Browser probe: cambio `level` in sidebar e tag corrispondente nel DOM del canvas e nella
      pagina pubblicata (vedi Comments per il dettaglio del limite).

## Notes

- I titoli non sono un campo responsive: il livello è semantica, non stile.
- L'editor inline è un `<div>` dentro l'`hN`. È HTML fuori specifica (`<h2><div>…`), tollerato dai
  browser e dai crawler; il compromesso è registrato in ADR-0041.
- Un autore che preme Invio dentro l'heading ottiene un secondo paragrafo: resta un heading, con la
  spaziatura del container. Non lo impediamo.

## Comments

- 2026-11-12 — Implementato e committato in `f91f2f40 feat(puck): emit a real heading element from
  the Heading block`.

  Cambi:
  - `src/puck/blocks/Heading/level.ts` è la allow-list chiusa (`HEADING_LEVELS`), il default `h2`,
    il type guard e le opzioni del campo. `HeadingProps.level` è `HeadingLevel` e
    `HEADING_DEFAULT_PROPS` porta `level: "h2"`.
  - `HeadingBlockUi` sceglie il tag con `isHeadingLevel(level) ? level : HEADING_DEFAULT_LEVEL` e
    mette `dragRef`, `block`, `puck-dim`, `puck-typo`, `puck-block-root`, `puck-rich-text`, le classi
    di layout e le variabili di stile sull'elemento `hN`.
  - Il campo `level` è un `select` H1–H6 in sidebar; `text` resta il campo rich text condiviso.
  - `src/puck/fields/rich-text/presets.ts` contiene il descrittore dati (`type`, `options`,
    `tiptap`) letto sia da `createRichTextField` sia da `render-config.tsx`. Le `options` del
    preset heading disattivano heading, liste, blockquote, code, codeBlock, strike, horizontalRule e
    textAlign, e forzano `link: false` per l'invariante del mark condiviso.
  - `puck-base.css` aggiunge `.puck-rich-text` con `p + p { margin-top: 1em }` e margini azzerati su
    primo/ultimo figlio. Il selettore è discendente e non diretto: sia il canvas sia la pagina
    avvolgono il contenuto in un `<div>` di Puck, quindi `> :first-child` non raggiungerebbe i
    paragrafi.
  - Nuovo `src/puck/__tests__/heading-block.test.tsx` e `rich-text-field.test.tsx` aggiornato.

  Verifiche:
  - `npm run typecheck` pulito.
  - `npm run lint`: 0 errori, 243 warning preesistenti.
  - `npm run test:run`: 252 file / 2151 test verdi.
  - Browser probe sul builder (`about`, frame `preview-frame`): click sull'heading "Collaboratore e
    Articolista", Level in sidebar, select H1–H6. Portato il select a H3, il DOM del canvas è
    passato da `<h2>` a `<h3>` con le stesse classi root. La pagina pubblicata `/about/` rende lo
    stesso blocco come `<h2>` (default, valore mancante) e il render pipeline pubblico è coperto dai
    test di parità.

  Nota: il probe non ha salvato né pubblicato il cambio di livello, per non modificare la pagina
  condivisa di sviluppo. Il percorso editor → pagina per un livello esplicito è garantito dallo
  stesso descrittore e dallo stesso render usati dai due config, verificati da
  `render-pipeline.test.tsx`.
