# Editor root as a container surface

## Goal

Let the editor set layout, dimension and decoration once on the document root, so a Header, Footer or Page does not need a wrapping Container just to carry a surface — and drop the inert `title` prop.

## Background

- `RootEditor` is shared by Pages, Headers and Footers and currently exposes `title` and `dimension`; the Header root adds `sticky` (`src/puck/root/`). `renderRoot` renders a single `div.puck-dim`.
- `title` is read by no render path (`renderRoot` never destructures it), so it is inert in every Puck document, not only in the regions.
- `Layout`, `Typography` and `Decoration` are **block-level** fields (`src/puck/fields/`). ADR-0038 and the "Root keeps its Dimension-only field" acceptance criterion in `.scratch/site-region-authoring/issues/03-layout-and-responsive-visibility.md` deliberately excluded them from the root.
- The authoring experience exposed the cost of that decision: a Footer that needs a surface or a row must wrap every block in a Container, which adds an element to the HTML for no semantic reason. The user asked for the root to behave like a Container.
- Typography stays out: `.puck-typo` and `.puck-nav` reset their variables locally on every block that owns text, so a root value would reach only text without an owner — a control that works sometimes is worse than no control. Reconsidering this means changing the reset strategy, which is a separate effort.

## Decisions

1. **Root surface = Layout + Dimension + Decoration**, applied to the existing root wrapper element. No element is added to the public HTML.
2. **Layout on the root keeps Block/Flex/Grid but not None.** The display control is what makes flex/grid meaningful, so it stays; the `None` option is removed because a root is never hidden. `display: none` on a Page root would blank the canvas with no placeholder (the editor ghost targets `[data-puck-component]`, which the root is not) and would make a whole region disappear from the site at one Breakpoint without warning.
3. **The root always renders as a block by default.** The root emits `--disp-d: block` when no display is authored, so a document that predates this change never resolves `display: var(--disp-d)` to `inline`. Layout classes are applied unconditionally on the root (unlike leaf blocks, which opt in per authored breakpoint).
4. **Decoration is applied only when authored**, keeping the DOM and class list of existing documents byte-identical.
5. **One root config for all three documents** (Page, Header, Footer); the Header keeps extending it with `sticky`. No duplicated roots with different behaviour.
6. **`title` is removed** from `RootProps`, `RootEditor` and `rootRenderConfig.fields`. Stored documents keep the stray prop; nothing renders it.
7. **The public render path stays editor-free**: the root render keeps importing only the root UI and the shared style-variable utilities.

## Data model

```ts
export type RootProps = {
  children: ReactNode;
  dimension?: Responsive<DimensionProps>;
  layout?: Responsive<LayoutProps>;
  decoration?: Responsive<DecorationProps>;
};

// Header only
export type HeaderRootProps = RootProps & { sticky?: boolean };
```

## Tickets

| # | Ticket | Depends on |
| - | ------ | ---------- |
| 01 | Root surface fields | — |
| 02 | Remove the root title | 01 |

Feature order: implement this effort before `.scratch/page-builder-site-layout-preview/`. Both touch `src/puck/config.ts` and the root modules; doing the root surface first keeps the site-layout preview built on the final root wrapper.

## Out of scope / follow-ups

- Root Typography (needs a change to the per-block variable resets).
- Responsive visibility on the root (deliberately excluded, see decision 2).
- A dedicated "region surface" block: unnecessary once the root carries decoration.
- Removing the Container that the current Footer/Header documents use only as a surface — that is a content edit in the region editor, not a code change.

## Verification

- `npx tsc --noEmit`, targeted ESLint, `npm run test:run`, `npm run build`.
- Manual: a document saved before this change renders identically (no `display: inline` regression); a Footer with a root background and padding renders the same as the same Footer wrapped in a Container, with one less element; the Header keeps its sticky switch.
