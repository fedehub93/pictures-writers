---
Status: ready-for-agent
Type: spec
---

# Size and Spacing: split the block box into two style fields

## Problem Statement

The `Dimension` field in the Puck properties panel is two ideas in one accordion. It holds the box's own size — width, height, max width, min height, aspect ratio — and the space around and inside it — the four margins and the four paddings. Thirteen controls under a name that describes only the first half.

Two things follow.

- **Findability.** An author who wants padding opens a section called *Dimension*, which does not suggest it. No other section in the panel offers it either, so the control is reachable only by guessing.
- **Model.** This is the only style property in the Puck layer whose name stops at half its contents: `dimension` stores margin and padding, `getDimensionVars` emits the spacing variables, and the authoring surface is labelled after a geometric measurement rather than a category of controls. Every other style concern — layout, typography, decoration — is one concept with one field, one prop and one getter.

Two smaller defects sit on the same code:

- `DimensionProps` declares `top`, `left`, `right`, `bottom`, the stylesheet resets and consumes them, and nothing emits them: there is no `position` control anywhere, so they are dead keys in the type and dead rules in the CSS.
- The section is the longest in the panel, which is why margin and padding read as things that were appended to it.

The editor is being restructured, so the model is worth fixing now, while the number of stored documents is still small and the migration is cheap to verify.

## Solution

Split the authoring surface and the stored shape in two, and leave the rendering contract exactly as it is.

- **Size** holds width, height, max width, min height and aspect ratio. **Spacing** holds margin and padding, as two labelled groups. Both sit in the panel where the single Dimension field sits today, separated by Layout and, for text blocks, Typography.
- The prop, the type, the field and the getter are renamed to `size`; `spacing` is added. The names now say what they do, which is the point of the work.
- The block root still carries one class (`.puck-dim`) and the same style variables. The class is the reset and consumption scope of the box, not the twin of a field, and the ADR records why its name stays.
- The four dead offsets are removed from the type and from the stylesheet.
- A one-off, idempotent, dry-runnable migration moves stored documents to the new shape across every Page and Site region version, including history.

No published page changes appearance: the same variables reach the same element with the same values.

## User Stories

1. As a backoffice editor, I want a section called Spacing, so that finding margin and padding does not require knowing they live under Dimension.
2. As a backoffice editor, I want Size to hold only the box's own size, so that the section matches what its name promises.
3. As a backoffice editor, I want Margin and Padding still labelled separately inside Spacing, so that I can tell outside space from inside space at a glance.
4. As a backoffice editor, I want the same responsive ladder, reset dot and unit presets in both sections, so that the split changes where a control lives and nothing about how it behaves.
5. As a backoffice editor, I want the two sections to open and close independently, so that I can keep Spacing open while I adjust Size.
6. As a backoffice editor, I want the authored values of an existing document to survive the split, so that I do not have to re-enter spacing per breakpoint.
7. As a backoffice editor, I want a freshly dropped Button and Top bar to keep their default padding, so that neither block changes its starting look.
8. As a visitor, I want the published page to render exactly as before, so that an internal model change is not a redesign.
9. As a maintainer, I want one field, one prop and one getter per style concept, so that the Puck layer keeps one convention instead of one exception.
10. As a maintainer, I want no dead keys in the style types and no dead rules in the stylesheet, so that the next reader is not sent chasing an offset that no control can produce.
11. As a maintainer, I want the class name and the CSS variables unchanged, so that the split does not turn into a mechanical rename of 35 files.
12. As a maintainer, I want a pure, tested migration transform plus a dry-runnable runner, so that existing documents can be converted and verified before anything is written.
13. As a maintainer, I want the migration to cover every stored version rather than only current and live, so that the database holds one shape and a future version-history feature cannot silently lose spacing.
14. As a maintainer, I want no runtime compatibility layer in the render path, so that "no value" keeps meaning "inherit from the wider breakpoint" and a reset is never undone by a stale legacy value.
15. As a maintainer, I want no Prisma schema change, no tRPC procedure change and no publication change, so that the work stays inside the Puck layer.
16. As a maintainer, I want the decision recorded in an ADR and the panel vocabulary updated in the glossary and the canvas guide, so that the next reader knows why the class kept its old name.

## Implementation Decisions

- **Vocabulary.** `size` and `spacing` in the panel, in props, in types and in getters. `DimensionProps` → `SizeProps`, `DimensionField` → `SizeField`, `createDimensionField` → `createSizeField`, `getDimensionVars` → `getSizeVars`. The label *Dimension* is not kept anywhere.

- **Size field.** `src/puck/fields/dimension/` moves to `src/puck/fields/size/` with its view and its width presets. `SizeProps` keeps `width`, `height`, `maxWidth`, `minHeight`, `aspectRatio`; the aspect-ratio select and its custom input are unchanged. `createSizeField({ baseWidth })` keeps the `baseWidth` option and its meaning: the width a block resolves to when nothing is authored, named in the Width control's *Auto* row.

- **Spacing field.** A new `src/puck/fields/spacing/` holds `SpacingProps` (`marginTop/Right/Bottom/Left`, `paddingTop/Right/Bottom/Left`), the accordion field and a view with the two `bg-muted/60` groups and their Margin and Padding labels, built from the existing `PropHeader` and `ValueUnitInput`. The field is a peer of Size: same accordion convention, same responsive state, same reset behaviour.

- **Offsets removed.** `top`, `left`, `right`, `bottom` leave the style types and the stylesheet's reset and consume rules, including the three breakpoint blocks. There is no `position` control today, so nothing observable is lost; restoring the keys plus the rules is the whole reversal if a Position field ever ships.

- **Rendering contract unchanged.** `getSizeVars` keeps the existing width precedence machine exactly: authored width at the breakpoint (own or inherited, explicit `auto` included) → block base width → implied fill from an authored max width. `getSpacingVars` gains the eight margin and padding emissions that `getDimensionVars` currently carries. Both write the same variable names on the same element; `.puck-dim` keeps resetting and consuming all twelve, and the section comment states that the class is the box scope. No block class list changes.

- **Wiring.** All sixteen blocks and the root declare `size` and `spacing`. Panel order is block-specific fields → Layout → Size → Spacing → Typography → Decoration; on the root, Layout → Size → Spacing → Decoration, and the Header's sticky switch stays last. The root type and both root render paths (`PageRootContent` and the page editor root) forward both props. Comments in `src/puck/components/slot-surface.tsx` and `src/puck/types.ts` that name the style surfaces are brought in line.

- **Defaults and variants.** The Button's default padding and the padding its variants supply move to `spacing`; the Top bar's default padding moves too; the Separator's width and height stay in `size`. A freshly dropped block keeps its current look.

- **Image block.** The internal prop that carries the block's style variables to the image view is renamed to `sizeVars`, to match the getter it receives.

- **Migration.** `src/puck/migrations/` holds a pure transform and a `server-only` runner, with the CLI in `scripts/` and two npm scripts (`:dry-run` prints, the other writes). The transform is shape-based rather than type-based — it walks every object in the document and acts on any `props` object holding a `dimension` key, because the document root has props but no `type`. For each one it moves the eight spacing keys into `spacing`, writes the remainder as `size`, and deletes `dimension`. Both destinations are written even when one of them keeps no key: an absent half is not neutral, because the block render falls back on its own default for the surface the document does not carry (`TOP_BAR_DEFAULT_SIZE` and `TOP_BAR_DEFAULT_SPACING` are the live cases), while the single authored `dimension` suppressed those defaults as a whole. A document that already carries `size` or `spacing` was saved by the new editor and gains no empty sibling. A value that does not look like a responsive map (an object keyed by breakpoint) is preserved and reported as a warning. The transform is idempotent: after the first run no `dimension` key remains. The runner scans every `PageVersion` and every `SiteRegionVersion`, not only current and live, reports per row, isolates failures, and writes nothing in dry-run mode.

- **No runtime compatibility.** The render path reads `size` and `spacing` only. A per-property fallback would make a deleted margin indistinguishable from an authored one and would resurrect it; it is rejected on purpose. The consequence is a rollout constraint: stored documents must be migrated in the same window as the deploy, because code and data change shape together.

- **Rollout.** Default plan, in this order: take a database backup, deploy the code, run the migration immediately after the new container is serving, then clear the in-memory caches by restarting the container (see `docs/self-hosting/08-operations-runbook.md`). The order matters. The old code reads only `dimension`, so migrating before the deploy breaks the live site for the whole build, which is minutes; migrating after the swap breaks it for the length of the script, which is seconds. The restart is needed because a migration writes rows without calling `revalidatePath`, and this deployment keeps its ISR and `unstable_cache` in memory: a page rendered during the window would otherwise stay cached in its unstyled state until the 24h backstop. The admin "Build website" button remains the emergency fallback. If even that window is unacceptable, the alternative is an expand/contract pair of releases with a whole-object fallback (read `dimension` only when `size` is entirely absent, which is safe against the reset trap); that alternative is not part of this work.

- **ADR.** ADR-0044 records the split, the shared class and why its name stays, the rejection of the per-property fallback, and the decision to migrate historical versions.

- **No backend change.** No Prisma schema change, no tRPC procedure, no publication or revalidation change, no new API.

## Testing Decisions

A good test here asserts what an editor or a visitor can observe: the field a block exposes, the values a view offers, the variables a render emits, and what the migration produces from a representative document.

- **Seam: rendered output.** Extend the existing per-block UI and server-render tests. Width and height fixtures stay in `size`; every `marginTop`/`paddingTop` fixture moves to `spacing`; the emitted variables and the class lists stay identical, which is the proof that visitors see no change.
- **Seam: style getters.** Keep the existing width-intent tests (renamed) covering base width, implied fill and `auto`, and add coverage that `getSpacingVars` emits only authored keys and that neither getter emits an offset.
- **Seam: fields and their order.** Update the field-list and order assertions so they name `size` and `spacing` and pin Layout → Size → Spacing → Typography → Decoration on the blocks and on the root.
- **Seam: migration transform.** Test the pure transform with representative documents: a page document, a document root without a `type`, blocks nested in slots and zones, an already-migrated document, a document whose shape is malformed, and idempotency.
- **Seam: migration runner.** Test the report, that dry-run writes nothing, that a successful run writes both tables, and that one failing row does not abort the rest.
- **Prior art.** The per-block UI tests, `dimension-width-vars.test.ts` and `dimension-width-field.test.tsx`, the render-pipeline comparison, and the Site region migration tests and runner, which this work copies in shape.
- **Not tested.** No visual regression test and no browser test: the panel change is verified by opening a migrated page in the editor. Nothing is asserted about the CSS class string beyond the existing block tests.
- **Verification.** `npm run lint`, `npm run typecheck`, the full Vitest suite and `npm run check:doc-citations`. A production build is optional: this work touches neither routing, config nor Prisma.

## Out of Scope

- Renaming `.puck-dim` to something that names the box, such as `.puck-box`. Deferred to a vocabulary pass; the name is documented instead.
- A shared `surfaceFields` helper for the per-block field lists. The lists stay written by hand.
- A Position field, and with it the offsets.
- Spacing under a State (hover padding or margin).
- Any restyle of the Spacing internals: the two labelled groups stay as they are.
- Per-side presets or new unit presets in Spacing.
- Runtime backward compatibility for stored documents.
- Moving the Image block's natural-size concept into the Size field.
- Any change to the Typography, Layout or Decoration fields.

## Further Notes

- Canonical vocabulary: `GLOSSARY.md` → "Block styling" and "Block root". The Block root entry names the variables it carries and must be updated to size and spacing.
- Governing decisions: ADR-0039 (one breakpoint ladder) for the responsive contract, ADR-0040 (one element tree in canvas and page) for the single root element. This work respects both: one element, one class, one ladder.
- Predecessors: the Dimension field was introduced with the shared style fields and never separated; `docs/puck-canvas.md` documents the expected field list per block and is the checklist this work changes.
- The panel is Puck's default `<Puck.Fields />` in a 300px column. Each custom field renders its own collapsible accordion, so two sections cost no height until opened, and both can be open at once.
- Data volume is small, which is why the migration is worth doing now; the cost that does not shrink with time is the code churn, not the row count.
