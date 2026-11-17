---
Status: done
Type: task
Blocked by: none
---

# 06: The draft preview resolves its links

**What to build:** The Preview button opens `/draft/<slug>/` and the page there
shows what publishing will show: a Button pointed at a published Page, Post,
Product or category is an anchor, and a target that cannot be resolved is plain
text. Today the draft query is the only rendering read that does not resolve
Smart links, so every entity target in the preview is text — and, because the
hover rule is anchor-scoped, it also loses its hover there. Links keep behaving
as they always have: a click in the preview navigates.

**Blocked by:** none. It is independent of 05; it is sequenced after it only
because 05 repairs a defect that is already shipped.

**Status:** done

## Acceptance criteria

- [x] A Button whose target is a Page, Post, Product, blog category or shop
      category that has a live version renders as an anchor in
      `/draft/<slug>/`, with the same resolved URL the published page emits.
- [x] A target with no live version still renders as plain text in the preview,
      which is what publishing that document would produce. Nothing is resolved
      against a draft version.
- [x] External URLs and legacy `{ label, href }` documents render exactly as
      they do today.
- [x] Clicking a link in the preview navigates as it always has: no handler, no
      guard and no inert state is added to the preview, and the default anchor
      behaviour is left alone.
- [x] The stored draft document is not mutated: resolution clones, as it does on
      the published path.
- [x] A server test pins that the draft query resolves a Smart link, and a
      rendered-markup test pins the anchor in the draft document. The published
      query's behaviour is asserted as unchanged.
- [x] `GLOSSARY.md` gains a **Draft preview** entry that separates the three
      surfaces — the canvas is inert, the interactive preview navigates, the
      Draft preview is the page document in draft form with live links — and
      `InlineSmartLink`'s docstring keeps stating the same contract.
- [x] Typecheck, lint and the full test suite pass.

## Notes

- The gap is old and predates the Button. `ee6f022d` ("resolve smart links in
  the Link block") replaced the stored `href` with a Smart link and wired
  resolution into the published page and the live regions only;
  `getDraftPageBySlug` was never touched, so from that commit the preview has
  shown entity links as text. Before it, the Link field was a hand-typed `href`,
  which needed no resolution — that is why the preview "used to work".
  `9f9931c5` later added form hydration to the same query and again left
  resolution out.
- The fix mirrors `getPublishedPageBySlug`: hydrate the forms, then resolve the
  Smart links, in that order, on a cloned document.
- Live-only resolution is deliberate. Falling back to a draft version would show
  a link that disappears after publishing, and would add a resolution mode the
  resolver does not have. The preview predicts publication; it does not promise
  more.
- No ADR: the contract already exists on the published path and this read is
  brought in line with it. The glossary entry is the part that keeps the three
  "preview" surfaces from being confused again — the canvas is documented as
  text on purpose, and that is not the bug.
- Out of scope: resolving Smart links in the editor canvas (the spec keeps the
  stored document raw there), and any panel control that reports a target's
  publish state.

## Comments

- 2026-11-15 — Closed with `7340a3c8` (`fix(pages): resolve smart links in the
  draft preview`).

  `getDraftPageBySlug` now mirrors `getPublishedPageBySlug`: it hydrates the
  forms and then resolves the Smart links, in that order, on the cloned
  document. Live-only resolution is unchanged, so a target without a live
  version still becomes a plain-text span, and the stored draft keeps its raw
  Smart links for the editor. The draft route, `PuckRender`, the anchor click
  contract and the published read are otherwise untouched.

  `draft-preview-links.test.tsx` drives the draft read end to end: it pins the
  resolved `{ label, href }` on a draft page, renders that document through the
  same public Puck config the route uses and asserts the anchor, keeps a
  draft-only target as plain text, covers external and legacy `{ label, href }`
  links, asserts the stored version is not mutated, and pins that a published
  page still reads its live version while the preview reads its current one.
  The page's live `href` and title come from the shared resolver, so the other
  entity targets are covered by its existing tests.

  `GLOSSARY.md` gains the **Draft preview** entry and the **Canvas** entry now
  names all three live-link surfaces; `InlineSmartLink`'s docstring states the
  same contract. No ADR: the published path already defines it.

  Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
  pre-existing warnings); `npm run test:run` 261 files / 2297 tests pass.
