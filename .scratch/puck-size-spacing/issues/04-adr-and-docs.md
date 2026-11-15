# 04: ADR and documentation

**What to build:** Record the decision and fix the two documents that name the old field, so the next reader does not conclude that the split was free or that `.puck-dim` is a leftover.

**Blocked by:** 01, 02 (the ADR cites paths that must exist in the branch)

**Status:** ready-for-agent

- [ ] `docs/adr/0044-size-and-spacing-style-fields.md` records: the split into two authoring surfaces over one element; why the class and the variables keep their names (the class resets and consumes the box, it is not the twin of a field); why a per-property render fallback was rejected (absence means inherit, so a fallback resurrects a deleted value); and why every stored version is migrated rather than only current and live.
- [ ] The ADR has its `**Status**: accepted` line, a `## Considered options` section covering the panel-only split, keeping one prop, per-property fallback, and renaming the class, and a `## Consequences` section naming the rollout constraint: code and data change shape together.
- [ ] The ADR notes that `size` here is the box's width and height, not the XS–XL button size rejected in ADR-0043, and that the field ADR-0043 calls Dimension is now Size.
- [ ] The ADR is linked from `docs/adr/README.md` in the "Site layout and Puck" table.
- [ ] `GLOSSARY.md` → "Block root" names size and spacing among the variables the root carries, and a "Style variable" note is added only if the entry still reads correctly without one.
- [ ] `docs/puck-canvas.md` line 56 (the prose that lists the style surfaces) and lines 159-160 (the per-block field checklist) name Size and Spacing.
- [ ] `npm run check:doc-citations` passes: every path the ADR cites exists in the branch.

## Implementation notes

- Follow the shape of the existing ADRs: title, status, decision prose, `## Considered options` as rejected alternatives with a reason each, `## Consequences`.
- Do not rewrite ADR-0043 or ADR-0039. They were accurate when written; ADR-0044 carries the rename forward and links back.
- The ADR is the place where the shared class stops being surprising: "one element, one reset scope, two authoring surfaces" is the sentence a future reader needs before touching `.puck-dim`.
