# One Button block, whose variant is a set of props rather than a class

**Status**: accepted

The `Link` block was already a button. Its root is the anchor itself, it carries Dimension (padding, width), Typography and Decoration (background, border, radius), and its block base width is `fit-content` — a constant whose own comment calls fill "the deliberate choice for a full-width button". What it could not do was show an icon, and what its name promised was something else: a text link, which the rich text link mark, the Link list and the NavbarBlock already author. No published document contains the block, so it is renamed to `Button` in place instead of being kept beside a new one. A single block, with no `appearance` switch: `appearance: link | button` would be two components in one panel, hiding each other's fields and offering a second way to author what a link mark in a text block already authors.

A Button starts from a `variant` — primary, secondary, outline or ghost — and the author can override any value it sets. The variant is stored as the same props the author edits (`decoration` and `typography` per Breakpoint) and merged underneath them, never as a stylesheet class with a hand-written look. The reason is the feature after this one rather than this one: states, which have to assign the same props under a second condition. Only one pipeline can carry both a preset value and an authored value, and only if the preset is a value in that pipeline. The variant table is also where a future "save these props as a variant" writes.

States need their own variable namespace. An authored value reaches the Block root as an inline custom property (`--bgc-d`), and a stylesheet rule never outranks an inline declaration: `:hover { --bgc-d: … }` would be dead against an authored background. A state therefore appends its own variables (`--bgc-h-d`) and the stylesheet reads them from that state's rule. The contract is `--<prop>-<state>-<breakpoint>`, with the state as an **infix** so the Breakpoint stays the suffix every existing reader parses; the state is the outer axis and the Breakpoint the inner one, which is also the order of the CSS (`:hover` outside, media query inside). Only the read ships now: hover falls back to a colour derived from the base value, so it stays related to whatever colour the author painted, and an optional `--bgc-h-*` overrides it. No `Stateful` type and no state selector in the panel until a second state exists. States are reserved for Decoration and Typography — a hover that moves the box is a layout bug — so Dimension and Layout stay responsive-only.

## Considered options

- **Keep `Link` and add `Button` beside it.** Rejected: two blocks with the same props and the same render, differing by a name; every panel change lands twice and every author has to choose.
- **`appearance: link | button` on one block.** Rejected: two identities in one panel, fields appearing and disappearing, and a palette entry called Button that can read as a plain text link.
- **The variant as a stylesheet class.** Rejected: with states the class owns a look the state variables cannot override, so a hover would have to fight the variant and a preset could not be overridden per state.
- **Hover as a Decoration field, the Elementor way.** Rejected: it doubles the panel and still needs the state namespace above, so the freedom is not free; a value derived from the base colour plus an optional `--bgc-h-*` keeps base and hover related.
- **A `size` field (XS–XL).** Rejected: it writes padding and font size, which Dimension and Typography already author; two controls on one outcome.
- **Ship the state model now**, as a `Stateful` type plus a panel selector whose only option is Base. Rejected: dead code until a second state exists; the naming contract is the only part that has to be right today.
- **An `anchor` link type for `#section`.** Rejected: a fragment is already a URL. A type would touch the resolver, the guard and every picker for no new capability; the picker option reads "URL" instead of "External URL".

## Consequences

- The block is `Button` everywhere: `ButtonBlock`/`ButtonProps`, `src/puck/blocks/Button/`, the editor element metadata, the page palette (where an empty Actions category already exists for it) and the region palettes, where it stays in Basic beside Image. About six test files and `docs/puck-canvas.md` name it. No migration: no published document holds the old name.
- The icon is `1em` and follows the block's Typography instead of carrying its own size, so a button keeps one type scale.
- A Button with no target renders as non-interactive text in the canvas and on the page, and is never hidden: a call to action the author saw and approved must not vanish on publish.
- Typography stays a field of its own and the variant only sets its default. The panel does not show an inherited value as a placeholder, because a field cannot see the block's `button` prop; the section states the inheritance in one line instead.
- The NavbarBlock call to action keeps using `buttonVariants`, so two ways to style a button coexist for now. That is deferred, not decided.
- Terminology: `GLOSSARY.md` → "Button block", "Variant", "State", "Style variable", "Smart link".
