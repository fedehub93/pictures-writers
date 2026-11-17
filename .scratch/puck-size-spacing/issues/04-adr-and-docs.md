# 04: ADR and documentation

**What to build:** Record the decision and fix the two documents that name the old field, so the next reader does not conclude that the split was free or that `.puck-dim` is a leftover.

**Blocked by:** 01, 02 (the ADR cites paths that must exist in the branch)

**Status:** done

- [x] `docs/adr/0044-size-and-spacing-style-fields.md` records: the split into two authoring surfaces over one element; why the class and the variables keep their names (the class resets and consumes the box, it is not the twin of a field); why a per-property render fallback was rejected (absence means inherit, so a fallback resurrects a deleted value); and why every stored version is migrated rather than only current and live.
- [x] The ADR has its `**Status**: accepted` line, a `## Considered options` section covering the panel-only split, keeping one prop, per-property fallback, and renaming the class, and a `## Consequences` section naming the rollout constraint: code and data change shape together.
- [x] The ADR notes that `size` here is the box's width and height, not the XS–XL button size rejected in ADR-0043, and that the field ADR-0043 calls Dimension is now Size.
- [x] The ADR is linked from `docs/adr/README.md` in the "Site layout and Puck" table.
- [x] `GLOSSARY.md` → "Block root" names size and spacing among the variables the root carries, and a "Style variable" note is added only if the entry still reads correctly without one.
- [x] `docs/puck-canvas.md` line 56 (the prose that lists the style surfaces) and lines 159-160 (the per-block field checklist) name Size and Spacing.
- [x] `npm run check:doc-citations` passes: every path the ADR cites exists in the branch.

## Implementation notes

- Follow the shape of the existing ADRs: title, status, decision prose, `## Considered options` as rejected alternatives with a reason each, `## Consequences`.
- Do not rewrite ADR-0043 or ADR-0039. They were accurate when written; ADR-0044 carries the rename forward and links back.
- The ADR is the place where the shared class stops being surprising: "one element, one reset scope, two authoring surfaces" is the sentence a future reader needs before touching `.puck-dim`.

## Comments

- 2026-11-15 — ADR-0044 carries a fifth considered option beyond the four the ticket names: the whole-object fallback (expand/contract across two releases), because the spec offers it as the fallback if the deploy window is unacceptable and the ADR would otherwise leave the reader without the reason it was not taken. The "Style variable" note was not added: with "size and spacing, layout, typography and decoration variables" the Block root entry reads correctly on its own, which is the condition the ticket sets. The ADR also says why the variables keep their names — each is named after the CSS property it feeds, so none ever carried a field's name — which the ticket asks for beside the class.
- Landed in `d9e9c677`.
- Verification: `npm run lint` 0 errors (265 pre-existing warnings), `npm run typecheck` 0, `npx vitest run` 264 files / 2329 tests passed, `npm run check:doc-citations` 90 docs / 0 broken (the ADR staged first, since the check reads `git ls-files`).
