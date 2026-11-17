---
Status: ready-for-agent
Type: spec
---

# A Button block: one authored action, with a variant to start from

## Problem Statement

An author who wants a call to action drops the block called Link. It promises a
text link and renders a full button-sized box — padding, background, border,
radius, and a natural width as wide as the label. Two things are wrong with it
from where the author sits.

It cannot show an icon, so a "Start Playing" call to action with a play glyph —
the shape the reference editor offers — has to be assembled from an Icon block
beside a Link that cannot contain it, and the two drift apart at every
breakpoint. And it offers no starting look: every button on every page is painted
from an empty panel, so two authors produce two different primaries, and one page
with three calls to action can carry three different blues.

The name adds a third cost. A link in this CMS is already four things — the mark
inside a rich text passage, a row of the Link list, an entry of the NavbarBlock,
and a stored Smart link — and the block was named by none of them, while being
the only place where a standalone Smart link can be authored.

Finally, every button is static. The style fields describe the base appearance
per Breakpoint and nothing else: there is no hover, so the main call to action on
a page gives no feedback. Adding one as a one-off would also decide, by accident,
how the states planned for later are expressed.

## Solution

The block becomes a Button: one authored action — a text, an optional icon and a
target — that starts from a variant and can be repainted. It ships as the same
block renamed, not as a second block beside the old one, because a link that is
not a Button is already covered by the marks a text passage, a Link list and a
NavbarBlock author.

A Button starts from primary, secondary, outline or ghost, and the author can
override any value the variant sets, at any breakpoint. The icon is optional,
sits before or after the text, and takes its size from the button's own type
scale. Hover follows the colour the author painted, so an overridden primary
still hovers correctly, and a variant may dictate its own hover where the derived
colour would not read.

The variant is stored as the same props the author edits, never as a stylesheet
class, because states — the same props under a second condition — are planned:
only one pipeline can carry a preset value and an authored value at once, and a
state has to be able to override both.

Nothing changes for stored documents: no published document contains the block.

## User Stories

1. As a backoffice editor, I want a block called Button, so that I find the call
   to action by the name of the thing I am putting on the page.
2. As a backoffice editor, I want a freshly dropped Button to be a complete,
   themed call to action, so that I can publish it without opening a style field.
3. As a backoffice editor, I want to choose between primary, secondary, outline
   and ghost, so that a page ranks its calls to action without me mixing colours.
4. As a backoffice editor, I want no empty option in the variant list, so that I
   never have to ask what an unstyled button is.
5. As a backoffice editor, I want to override the background, border, radius and
   text a variant set, so that one page can depart from the theme without a
   second block.
6. As a backoffice editor, I want my override to win at the breakpoint I authored
   it, so that a variant stays a starting point and not a lock.
7. As a backoffice editor, I want to clear a style and get the variant's value
   back, so that undoing an override is one click.
8. As a backoffice editor, I want to write the button's text in a control of its
   own, so that changing the wording does not feel like editing a URL.
9. As a backoffice editor, I want the text above the link in the panel, so that
   the panel reads in the order the button reads.
10. As a backoffice editor, I want the text to auto-fill from the title of the
    page, post or product I link, so that I do not retype what the CMS knows.
11. As a backoffice editor, I want the text I typed to survive a target change,
    so that switching destination does not rename my button.
12. As a backoffice editor, I want to point a Button at a page, a post, a
    product, a blog category, a shop category or a URL, so that the call to
    action survives a rename of its destination.
13. As a backoffice editor, I want to reach `#section` through the URL field, so
    that a call to action can scroll to a lesson further down the same page.
14. As a backoffice editor, I want an optional icon, so that a play, arrow or cart
    glyph can carry the call to action.
15. As a backoffice editor, I want to choose whether the icon sits before or after
    the text, so that an arrow can point at what happens next.
16. As a backoffice editor, I want to tune the space between icon and text, so
    that a wide glyph does not crowd the label.
17. As a backoffice editor, I want the icon to scale with the button's text, so
    that I never fix it twice, once per breakpoint.
18. As a backoffice editor, I want a Button to open its destination in a new tab
    where the target allows it, so that an external partner does not cost the
    visitor the page.
19. As a backoffice editor, I want a Button with no target to stay visible while I
    author it, so that I can stage a call to action before its page exists.
20. As a backoffice editor, I want that same button to read as plain text on the
    published page instead of disappearing, so that nothing I approved vanishes on
    publish.
21. As a backoffice editor, I want a hover on every Button without authoring one,
    so that the page responds to the pointer without extra work.
22. As a backoffice editor, I want the hover to follow the colour I painted, so
    that my override does not get a theme hover that clashes with it.
23. As a backoffice editor, I want the same Button inside the header and footer
    regions, so that a persistent call to action is one block and not a special
    case.
24. As a backoffice editor, I want the Button in the Actions category of a page,
    so that I do not hunt for it among images and separators.
25. As a backoffice editor, I want a Button inside a flex or grid column to be as
    wide as its content by default, so that it reads as a button and not as a bar.
26. As a backoffice editor, I want to make a Button fill its column deliberately,
    so that a call to action can span the row on mobile.
27. As a backoffice editor, I want to author padding and margins per breakpoint,
    so that a small button on mobile becomes a bigger target on desktop.
28. As a backoffice editor, I want to hide a Button at a breakpoint, so that the
    layout adapts without a second copy of it.
29. As a backoffice editor, I want the canvas to select the Button instead of
    navigating when I click it, so that I never lose unsaved work.
30. As a visitor, I want the call to action to look like a button and react to my
    pointer, so that I know it is clickable.
31. As a visitor, I want a button without a destination to be plain text rather
    than a focusable dead link, so that the keyboard does not stop on nothing.
32. As a keyboard user, I want the focus ring to reach every Button that does link
    somewhere, and no others.
33. As a screen reader user, I want the icon not to be announced twice, so that I
    hear "Start Playing" once.
34. As a backoffice editor, I want the block to be called the same thing in the
    palette, the layers tree and the panel, so that nothing changes meaning
    underneath me.
35. As a maintainer, I want the variant to be data rather than a stylesheet
    class, so that the states planned for later can override a preset and an
    authored value through one pipeline.
36. As a maintainer, I want the hover rule to be the only stateful CSS in the
    block system, so that adding focus and active later is a rule plus a
    variable, not a redesign.
37. As a maintainer, I want the rename to need no migration, so that every
    document saved before it is unaffected.

## Implementation Decisions

- One block, renamed in place: the component and its props type, its defaults,
  the editor element metadata, the page palette and the region palettes all carry
  the name Button. No `appearance` switch: a plain text link stays a rich text
  mark, a Link list row and a NavbarBlock entry.
- The authored content of the block moves into a single prop holding the variant,
  the text, the Smart link, the icon, the icon position and the icon spacing.
  Layout, Dimension, Typography and Decoration remain separate props, as on every
  other block.
- One custom editor field renders that prop as one section, in the order
  Variant → Text → Link → Icon → Icon position → Icon spacing. It reuses the
  existing link editor with its label control switched off — the text is the
  section's own control — and the existing icon picker. No primitive Puck field
  is used, matching Form, Link and the style fields.
- The text is stored as the label of the Smart link, so the auto-fill from an
  entity title keeps working; the panel only presents it first.
- The variant table maps each variant to Decoration and Typography values per
  Breakpoint, on the theme tokens already in use. The block render merges it
  underneath the authored values, key by key, before the style variables are
  computed, so an authored value wins at its breakpoint and the variant's value
  survives where nothing was authored. The table is also where a future "save
  these props as a variant" would write.
- Variants are primary, secondary, outline and ghost. The prop has no empty
  value; the block's default is primary.
- No size control: padding and font size are the size.
- The icon is one em wide and inherits the block's Typography, so a button has one
  type scale. Its spacing is a unit value defaulting to half an em. The anchor
  lays out inline-flex with that gap only when an icon is present.
- Hover is read, not authored: one rule in the shared stylesheet reads the
  state's variables and falls back to a colour mixed from the base value, so a
  button whose background the author overrode still hovers correctly. A variant
  may set the state variables where the derived colour would not read.
- The style-variable naming contract becomes `--<prop>-<state>-<breakpoint>`,
  with the state as an **infix**, so the Breakpoint stays the suffix that every
  existing emitter and reader parses. The state is the outer axis and the
  Breakpoint the inner one, matching the CSS: the state's rule outside, the
  media query inside.
- Only the read of the state ships. No state type, no state control in the panel,
  no per-state Typography or Decoration props.
- States are reserved for Decoration and Typography. Dimension and Layout remain
  responsive-only.
- The link picker's external option reads "URL" instead of "External URL". A
  fragment is already a URL, so no anchor type is added to the Smart link model.
- Server-side resolution needs no change: the document walk recognises a Smart
  link by shape, so a link nested inside the Button's prop resolves like any
  other and a broken target still renders as text.
- A Button whose target resolves to nothing renders as non-interactive text in
  the canvas and on the published page. It is never hidden, and never a focusable
  anchor.
- The page palette lists Button under its own Actions category, which exists and
  is empty. The region palettes keep it in Basic beside Image, where it composes
  a header or footer rather than being a page action.
- The block's base width keeps its contract and its value, renamed with the
  block, because the same constant is read by both the Width panel and the
  render.
- No schema change and no data migration: no published document contains the
  block.
- ADR-0043 already records the decision, and the glossary already carries Button
  block, Variant, State, Style variable and Smart link.

## Testing Decisions

A good test here drives the block from its props and asserts what a reader of the
page — or the browser — would observe: the element emitted, its attributes, and
the style contract on the block root. It does not assert the shape of the variant
table, the order of a merge, or the internal function that computes the
variables, and it never asserts a computed layout, which no DOM in this repo can
produce.

Five seams exist today and none is added.

- **Block render (highest).** Props in, markup out. Covers: a variant emits its
  style variables; an authored decoration wins on the same keys at the same
  breakpoint and inherits the variant where nothing was authored; the icon
  appears inside the anchor with its position and the gap; a target that resolves
  to nothing emits text and no anchor; the canvas and the published page emit
  identical markup. Prior art: the existing Link block render test, which asserts
  the root tag's style contract for the base width and the padding.
- **Palettes and editor config, as data.** Covers: Button appears in the page
  palette under Actions and in the region palettes beside Image, Link is gone
  from every one of them, and the public render config agrees with the palettes.
  Prior art: the region palette, render config and editor config tests.
- **Server-side resolution.** Covers: a document whose Button carries a nested
  Smart link resolves to a label and an href, and a target that does not resolve
  renders as text. Prior art: the site-region resolution test.
- **Canvas inertness.** Covers: the anchor keeps its markup and its target while
  editing and does not navigate, the selection ref lands on the root, and the
  parity test still reports identical canvas and page markup. Prior art: the
  canvas link inertness test.
- **Stylesheet rules, as data.** Covers: the hover rule reads the state's
  variables with the derived fallback, sits on the block's own selector, and
  nothing redefines the base variables under a state. Prior art: the stylesheet
  rule reader and the breakpoint ladder test.

What a unit test cannot prove is claimed by hand: the hover appearance and the
icon's vertical alignment are accepted in the canvas and on the published page by
the maintainer, as the base-width measurement was in the previous spec.

## Out of Scope

- States as an authorable feature: no state control, no per-state Typography or
  Decoration props, and no focus, active or disabled state. Hover only, read only.
- Unifying the NavbarBlock call to action, which keeps using the theme's button
  variants. Two ways to style a button coexist for now.
- Author-defined or saved variants beyond the four.
- A size control, and semantic variants — info, success, warning, danger,
  destructive.
- Teaching the rich text link mark the entity picker.
- Migrating stored documents: none exist.
- A button that submits a form; the Form block owns its own submit control.
- Any change to the Link list, the Copyright or the NavbarBlock behaviour.

## Further Notes

- ADR-0043 and the glossary entries are already written and accepted, so this
  work should not have to revisit them except for wording.
- The panel cannot show an inherited variant value as a placeholder, because a
  field sees only its own prop. The section states the inheritance in one line
  instead. Reading the selected item's props through the editor store is a
  possible later improvement, not part of this spec.
- The reference for the shape is Elementor's Button widget — Type, Text, Link,
  Icon, Icon Position, Icon Spacing — without its dashboard-semantic Types and
  without its Size presets.
- Keep three terms apart: a **Smart link** is a target, a **Button** is a block,
  and a **CTA** is a NavbarBlock menu item.
- `.scratch/puck-link-block-contract/` stays closed and unchanged. The base width
  constant it introduced is renamed with the block and keeps its behaviour.
- `docs/puck-canvas.md` still names the Link block; it is updated with the code,
  not here.
