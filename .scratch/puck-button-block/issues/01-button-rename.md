---
Status: done
Type: task
Blocked by: none
---

# 01: The block is called Button

**What to build:** The block an author drops to put a call to action on a page is
called Button, in the palette, in the layers tree, in the panel and in the
exported types, because that is what it renders. On a page it lives in the
Actions category; inside a Site region it stays in Basic beside Image, where it
composes a header or a footer rather than being a page action. Nothing about how
it looks or behaves changes: this is the prefactor that keeps every later diff
talking about a block whose name matches what it does.

**Blocked by:** None (can start immediately)

**Status:** done

## Acceptance criteria

- [x] A page palette offers **Button** under Actions, and the Header and Footer
      region palettes offer it under Basic next to Image; no palette still offers
      a Link.
- [x] Every surface that names the block — palette, layers tree, block settings,
      outline — says Button, and the exported props type and editor metadata use
      the new name.
- [x] The block renders exactly the markup it rendered before the rename for the
      same props: same anchor, same style contract on the block root, same
      plain-text fallback for a target that resolves to nothing.
- [x] No other block changes category or availability: the rename moves this
      block and nothing else.
- [x] Documentation that names the block is updated in the same change, and the
      tests that named the old name are renamed.
- [x] No stored document contains the old block, so nothing is migrated and no
      seed or script has to change.
- [x] Typecheck, lint and the full test suite pass.

## Notes

- This is the one deliberately horizontal ticket in the feature, and it is
  sequenced first for reviewability: a mechanical rename of about a dozen call
  sites inside one package, with no caller outside it, so expand–contract would
  add a second form nobody needs. Keeping it separate stops the rename noise from
  burying the actual feature in the next three diffs.
- The block's base width constant is renamed with the block and keeps its value
  and contract: the Width panel and the render still read one constant.
- The page palette's Actions category already exists and is empty; this ticket is
  where it gains its first entry.
- Registration keys are part of the rename, which is safe only because no
  published document holds the block. If a development database still holds one,
  it is a development artifact: the block will not render under the new name
  until the page is re-authored, and that is acceptable.

## Comments

- 2026-11-14 — Closed with `c9e52441` (`refactor(puck): rename the Link block to
  Button`). The registry key, `ButtonProps`, `ButtonBlock`, `renderButtonBlock`,
  `BUTTON_DEFAULT_PROPS`, `BUTTON_BASE_WIDTH` (`fit-content` unchanged), editor
  metadata and tests now carry `Button`. The page palette lists it under
  **Actions**; the Header and Footer keep it in **Basic** beside Image. Added
  `page-palette.test.ts` for the page placement and the absence of `Link` in both
  page configs. Docs updated in `docs/puck-canvas.md`, ADR-0040 and the stale
  comments in the link field and Image block. No migration or seed change:
  `prisma/` and `scripts/` contain no reference to the old block, and the ticket
  note establishes no published document holds it. The click-contract suite keeps
  its `canvas-link-inert` filename because it covers every anchor-root block, not
  the old block.
- Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
  pre-existing warnings); `npm run test:run` 257 files / 2243 tests pass. No
  browser probe: the ticket changes no markup or interaction.
