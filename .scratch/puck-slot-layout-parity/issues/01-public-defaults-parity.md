---
Status: done
Type: task
Blocked by:
---

# Public render applies the editor defaults

## What to build

A block dropped from the palette must look the same in the canvas and on the
published page. Puck's `defaultProps` are merged in the editor only, so the
public render currently receives the stored props as-is; this ticket gives the
public path the same values from a single definition, and makes the parity test
prove it for every block that can render without the database — including a
block rendered with no props at all.

## Blocked by

None (can start immediately).

## Acceptance criteria

- [x] Every block default has one definition, shared by the editor component
      config and the public render path, including the composite objects of the
      region blocks. No block keeps a private copy.
- [x] The public render applies those defaults with Puck's shallow spread:
      explicit values win, an authored nested object replaces the default one
      whole, and slot functions override like any other authored value.
- [x] A block rendered with empty props produces identical markup through the
      editor config and the public config. The Icon block is the documented
      empty case.
- [x] A freshly dropped Image keeps its natural size (ADR-0039, revision); full
      width stays an explicit Dimension choice, and documents that authored it
      are unchanged.
- [x] The page root declares its full width explicitly instead of resolving an
      unset dimension variable to `auto`.
- [x] The glossary records the contract (*Puck editor fidelity*).
- [x] Tests: the parity test walks every block that renders without server data,
      with authored props and with empty ones (Brand, Copyright and NavbarBlock
      are excluded and the reason is documented); the full suite and the
      two-axis code review pass.

## Implementation notes

- All defaults live in `src/puck/blocks/defaults.ts`. The composite objects
  (Top bar, Brand, Copyright, LinkList, SearchBar, NavbarBlock) are exported
  there too, and each block's `index.tsx` assigns the constant instead of
  restating the literal. `BLOCK_DEFAULT_PROPS` is the keyed map the parity test
  walks.
- The public wrapper receives the defaults object, not a component name, so a
  typo cannot silently ship a block with no defaults. It applies the same
  shallow spread Puck uses in the canvas; a deeper merge would keep a
  per-breakpoint default the canvas has already dropped.
- The Image block has no `defaultProps` at all. The previous `100%` default was
  applied in the canvas only and stretched logos placed in a flex row; with the
  defaults reaching the public render it would also restyle every stored
  document that never declared a width. ADR-0039 was revised accordingly.
- Container, Flex and Grid keep the defaults they had before this change: no
  width is added, so existing documents are not restyled.
- The Top bar slot classes are deliberately not part of this ticket; they belong
  to the layout work in ticket 02.
- `CONTEXT.md` gained *Live source of truth*, *Slot wrapper parity* and *Public
  defaultProps*, so the next change in this area does not have to rediscover the
  mechanism.

## Verification

- `npx tsc --noEmit` clean.
- `npm run test:run -- src/puck/__tests__`: 31 files / 242 tests pass.
- `npm run test:run` (full suite): 243 files / 2004 tests pass.
- ESLint on the touched files: only pre-existing warnings.
- Two-axis code review (Standards and Spec): all findings addressed — see the
  comments below.

## Follow-up

The parity test applies the shared defaults map to the editor render by hand, so
it cannot catch a component whose `defaultProps` diverges from the map. The
registry-consistency assertion that closes this gap is part of ticket 02.

## Comments

**2026-11-11 — two-axis review.** The first pass shipped a deep merge, six
private copies of the composite defaults, a string-keyed wrapper with a silent
fallback, a new width default on the three layout blocks, and a Top bar change
that belongs to ticket 02. All were corrected: the merge now mirrors Puck, the
composites are single-sourced, the wrapper takes the object, the width defaults
were removed, and the Top bar change moved to ticket 02. The Image default
conflicted with ADR-0039; the ADR now carries a dated revision explaining why
natural size is the default once defaults reach the public render.
