# 05: Renderer pubblico

**What to build:** Il renderer pubblico di Tiptap supporta i quattro nodi della tabella (Table, TableRow, TableCell, TableHeader) tramite gemelli schema-only, così le tabelle create nell'editor vengono renderizzate correttamente su post e prodotti pubblici. Il rendering produce un elemento `<table>` con bordi sempre visibili e header in evidenza, coerente col tema del sito. Il supporto è completo sia per l'output React element sia per l'output HTML string. Il roundtrip tra il documento dell'editor di produzione e il renderer pubblico non introduce variazioni semantiche rispetto allo schema del documento.

**Blocked by:** 02 (Table node and entry points)

**Status:** ready-for-agent

- [x] Il renderer pubblico espone i quattro nodi della tabella e produce un `<table>` con bordi sempre visibili e header evidenziato.
- [x] Il rendering è corretto sia in React element sia in HTML string.
- [x] Test sul seam rendering: un documento con Table produce output tabellare atteso e round-trippa senza perdita semantica.
- [x] I nodi esistenti nel renderer pubblico continuano a funzionare invariati.

## Verification

Implemented and verified in-cognition on this repo:

- Renderer twins `src/shared/components/tiptap-renderer/extensions/table/index.ts` — `TableNodeRenderer` (schema-only, `tableRole: "table"`, reuses `createColGroup`, always emits `<table class="post__table">` + `<tbody>`), `TableRowNodeRenderer`, `TableCellNodeRenderer` and `TableHeaderNodeRenderer` (content `paragraph`, `isolating`, attrs colspan/rowspan/colwidth `rendered: false`, align via inline style). Registered in `tiptapContentExtensions` (`src/shared/components/tiptap-renderer/extensions.ts`), so both `TipTapRendererV2` (React element) and `renderTiptapHtml` (HTML string) pick them up via their `renderHTML` — no `nodeMapping` entries needed.
- Styling `@utility post__table` added to `src/app/(home)/home.css` and `src/app/(admin)/admin.css` (border-collapse table, borders on `th`/`td`, `bg-muted` + bold header).
- Rendering seam tests `src/shared/components/tiptap-renderer/__tests__/table-rendering.test.tsx` (7 tests, green):
  1. produced table doc → expected HTML string (`<table class="post__table">`, `<tbody>`, `<tr>`, `<th>`, `<td>`, colgroup).
  2. same doc → React element output with identical table markup inside the prose wrapper.
  3. no internal attrs leak into HTML (`colspan|rowspan|colwidth` absent).
  4. roundtrip through the renderer schema (`getSchemaByResolvedExtensions` + `Node.fromJSON` → `toJSON`) equals the produced editor doc; re-loading into the production editor keeps it identical too.
  5. explicit `colwidth`/`align` survive into the public HTML (`width: 300px`, per-col widths, `text-align: center`).
  6. table without header row renders with body cells only (`no <th>`).
  7. table renders side by side with existing renderer nodes (paragraph, heading, blockquote, infobox, image, tablecontent) without regressions.
- Full suite green: 36 files, 307 tests; `npx tsc --noEmit` clean; ESLint clean on the touched files.
- Note (out of scope): `normalizeContent` can theoretically inject ad nodes inside table cells (cells accept `paragraph` only in both editor and renderer); the renderer schema deliberately mirrors the editor's `paragraph`-only cell content.