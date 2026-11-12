# 05: Nascondere il campo contenuto dalla sidebar

**What to build:** Il campo contenuto dei due blocchi sparisce dal pannello delle proprietà
(`visible: false` sul descrittore). Puck applica `visible` solo quando disegna la sidebar: il
transform del canvas legge il descrittore grezzo, quindi il valore resta editabile sul blocco. Con
il campo sparisce anche il `renderMenu` che viveva lì: link e colore esistono ormai solo nella
toolbar inline, e questo ticket è il punto in cui lo stato intermedio diventa definitivo. La
sidebar resta per tipografia, dimensioni e layout.

**Blocked by:** 02, 03, 04

**Status:** done

**Skills:** `.agents/skills/puck` (progetto). Leggere
`https://puckeditor.com/docs/api-reference/fields/base.md` (parametro `visible`).

- [x] Entrambi i preset dichiarano `visible: false`; nessun campo contenuto compare nella sidebar di
      `Heading` e `Text`.
- [x] `renderMenu` e il codice del menu di sidebar vengono rimossi dal campo, non lasciati morti.
- [x] Il render config pubblico resta invariato: il descrittore continua a dichiarare il campo,
      perché serve a risolvere il valore a render time.
- [x] Il canvas continua a montare l'editor inline e la toolbar con link e colore.
- [x] Test: i descrittori dichiarano `visible: false`; il render del blocco non cambia.
- [x] Browser probe: sidebar senza campo testo, click nel blocco che entra comunque in editing,
      formattazione applicabile.

## Notes

- La via di ritorno è documentata: togliere `visible: false` riporta il campo in sidebar, senza
  toccare il resto (ADR-0041).
- Se in futuro servisse una vista sull'HTML grezzo, è un campo custom separato (una tab "Codice"),
  non la riaccensione di questo.

## Comments

- 2026-11-12 — Implementato.

  Cambi:
  - `createRichTextField` aggiunge `visible: false` accanto a `contentEditable: true`, dopo lo
    spread del descrittore: sono entrambi membri editor-only, quindi il render config pubblico
    continua a ricevere il descrittore senza flag e il campo resta dichiarato per risolvere il
    valore a render time. La posizione dopo lo spread rende l'invariante esplicito.
  - Rimosso `renderMenu` dal tipo e dalla factory; la sidebar non ha più un menu. Il menu inline di
    default (`InlineMenuWithLinks`) e quello di `Text` (`TextInlineMenu`) restano l'unica
    superficie. Aggiornati i commenti che citavano ancora la sidebar.
  - `rich-text-field.test.tsx`: entrambi i preset dichiarano `visible: false` e non hanno
    `renderMenu`; i descrittori pubblici restano senza i flag editor-only. I test di blocco,
    `render-pipeline` e la suite completa restano verdi, quindi il markup pubblico non cambia.

  Verifiche:
  - `npm run typecheck` pulito.
  - `npx eslint` sui due file toccati: pulito.
  - `npm run test:run`: 252 file / 2168 test verdi.
  - Probe CDP sul builder di `about` (frame `preview-frame`, finestra 1440×1000), zero eccezioni:
    - `Heading` "Chi siamo": click nel testo, `ProseMirror` attivo con `contenteditable="true"` e
      toolbar con `Add link` e `Text color`; Ctrl+B ha prodotto `<strong>` sul testo selezionato.
      Sidebar: `Page › Heading`, `Level`, `Layout`, `Dimension`, `Typography` — nessun campo
      contenuto, nessun `contenteditable` nel documento superiore.
    - `Text`: trascinato dalla palette e lasciato non salvato; la sidebar mostra `Page › Text`,
      `Layout`, `Dimension`, `Typography` e nessun campo contenuto; click nel blocco con editor
      inline attivo e toolbar completa. La pagina è stata ricaricata dopo il probe e il DB
      verificato: nessun blocco `Text` è stato persistito.

  Nota: il probe è stato eseguito con una sessione admin temporanea, rimossa insieme al ripristino
  della password di sviluppo al termine.
