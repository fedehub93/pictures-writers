---
Status: ready-for-agent
Type: spec
---

# A block's starting look is a class of Style variables, not an inline copy per instance

## Problem Statement

A Button dropped on a page arrives painted: primary, secondary, outline or
ghost, plus a target-sized box. All of it is written into the element's `style`
attribute — about 44 declarations on a fresh primary, 39 of them the variant
alone, materialized at all three Breakpoints. Nothing in those 39 is a fact
about that Button: the document already says which variant it is, and the same
39 declarations are repeated on every Button of that variant anywhere on the
site. On a page with three calls to action, the DOM shows three identical
forty-line blocks and hides the five values that are actually the instance's
own.

The base box has a second problem. Its four paddings arrive from the block's
default props and are written onto the instance as if the author had painted
them. In the panel they read as authored values, so an author who clears the
padding strips the Button of its box and it collapses — the opposite of what
clearing a Decoration field does, where the variant's value comes back.

## Solution

The look a block starts from is declared by the block's own class, as the same
Style variables the render used to write. One class per Variant, carrying its
base and the hover it dictates; one base rule carrying the box. A value the
author writes still reaches the Block root inline, and inline outranks the
class, so an authored value still wins at the Breakpoint it was authored at —
that guarantee stops being a merge performed in the render and becomes an
invariant of the stylesheet.

Visible result: a freshly dropped Button carries a class and at most five
declarations of its own. The four variants look exactly as they look today, in
the canvas and on the published page. Clearing a padding value returns the
Button's box instead of collapsing it.

## User Stories

1. As a backoffice editor, I want a freshly dropped Button to look identical to
   the one this block produced yesterday, so that nothing I have already
   accepted changes on the page.
2. As a backoffice editor, I want the four variants to keep their look, so that
   the pages I built do not shift under me.
3. As a backoffice editor, I want an authored background, border or radius to
   still win over the variant, so that my override is never fought by a preset.
4. As a backoffice editor, I want my override to still win at the Breakpoint I
   authored it at, so that a variant stays a starting point and not a lock.
5. As a backoffice editor, I want clearing an authored value to bring the
   variant's back, so that undoing an override is one click.
6. As a backoffice editor, I want to keep clearing a padding value, so that the
   Button keeps its target-sized box instead of collapsing.
7. As a backoffice editor, I want a Button's padding to read as "not authored
   yet" until I write it, so that the panel stops showing me a value I never
   typed.
8. As a backoffice editor, I want the panel to say in one line where the unset
   values come from, so that an empty field is not a mystery.
9. As a backoffice editor, I want the Width control to keep naming the block
   default it applies, so that its *Auto* row still explains itself.
10. As a backoffice editor, I want a Button whose stored variant is no longer
    one of the four to still render as primary, so that a document that outlived
    a rename is not stripped of its look.
11. As a backoffice editor, I want the hover to keep working without authoring
    one, so that the page still answers the pointer.
12. As a backoffice editor, I want an overridden primary to keep hovering from
    the colour I painted, so that the feedback stays related to my button.
13. As a backoffice editor, I want outline and ghost to keep their own hover, so
    that a transparent button still shows feedback.
14. As a backoffice editor, I want a Button with no target to keep rendering the
    same way, so that staging a call to action still works.
15. As a visitor, I want every Button to look and hover exactly as before, so
    that a refactor of how the look is expressed is invisible to me.
16. As a visitor, I want a smaller page, since the same forty declarations are no
    longer repeated per Button, so that the call to action costs less than the
    content around it.
17. As a maintainer, I want the variant's values in one place in the stylesheet,
    so that changing a primary's background is one edit and not a table plus a
    merge.
18. As a maintainer, I want the render to stop resolving styles, so that the
    block's code says "this is a primary" and nothing more.
19. As a maintainer, I want a test to fail if a variant rule ever declares a
    property or `!important`, so that the override guarantee cannot be broken in
    silence.
20. As a maintainer, I want the variant's per-Breakpoint behaviour to keep
    riding the one ladder, so that a second mechanism does not appear.
21. As a maintainer, I want the Button to be the only block with a class-owned
    starting look, so that the rest of the block system keeps its default props
    and the exception is a decision, not a drift.
22. As a maintainer, I want the change recorded as a decision that supersedes
    the earlier one, so that a future reader is not told two opposite things.
23. As a maintainer, I want no schema change and no migration, so that no
    stored document has to be touched.
24. As a maintainer, I want the panel's field set unchanged, so that nobody has
    to relearn where things are.
25. As a maintainer, I want the canvas and the published page to keep emitting
    identical markup, so that the canvas keeps its promise.
26. As a maintainer, I want the docs and the glossary to name the new division —
    what the document stores, what the stylesheet owns, what inline means — so
    that the next change starts from the right model.

## Implementation Decisions

- **Scope of the move.** Only the look a block starts from leaves the inline
  style attribute: the Variant's Decoration and Typography, its dictated hover,
  and the Button's four paddings. Spacing, Size and Layout values the author
  writes stay inline, because they are the instance. The base width stays inline
  too, because the Width control quotes the same constant and a class would give
  that value two sources.
- **The mechanism.** The block's root class declares the same Style variables the
  render used to emit, one specificity level below an inline declaration. The
  guarantee "an authored value wins, at its Breakpoint" therefore becomes an
  invariant of the stylesheet: a Variant rule and a base-box rule declare only
  custom properties, never a property, never `!important`.
- **One class per Variant**, on the Block root alongside the block's other root
  classes, emitted on the anchor and on the plain-text fallback alike. The class
  name is derived from the stored variant at render, never stored itself.
- **Hover travels with the Variant.** The base declarations and the state
  declarations a Variant dictates live in the same class. Primary and secondary
  still dictate no state variables, so their hover stays derived from the base
  background; outline and ghost still name the theme's hover surface. The
  stylesheet's single stateful rule keeps reading the state's own variables and
  keeping the derived fallback.
- **One rung, inherited.** A Variant declares its values on the desktop rung
  only; the existing ladder carries them to tablet and mobile, and the Reset
  scope still stops them leaking from an ancestor. A Variant that ever differs
  per Breakpoint adds a media query rather than a second mechanism.
- **The stylesheet is the source of truth** for the four looks. The TypeScript
  table and the merge it went through are deleted; what remains is the variant
  type, the list the panel offers, the default, and the fallback that resolves a
  value a stored document no longer matches to the default variant, so such a
  Button still carries a look.
- **The Button's base box** is declared by the block's class as its four
  paddings, and stops being part of the block's default props. A cleared value
  therefore returns the base instead of unsetting the box. A stored document that
  carries its paddings keeps them and renders identically; a document that stored
  padding at one Breakpoint only gains the base at the others, which is the
  clearing rule working, and needs no migration.
- **The panel does not change shape.** The same fields, in the same order. The
  line of copy that states the Variant's inheritance now covers the base box
  too; no field shows an inherited value as a placeholder, because a field sees
  only its own prop.
- **The NavbarBlock's call to action keeps its theme button classes.** Two ways
  to style a button still coexist, as they did before this spec.
- **No schema change and no migration.** The document keeps storing what it
  stored: the variant's name and, where an author wrote one, a value per
  Breakpoint.
- **The record.** A new ADR records the decision and partially supersedes the
  earlier one on how a Variant is expressed; the glossary carries Style
  variable, Variant and Base box.

## Testing Decisions

A good test here drives the block from its props and asserts what a reader of the
page — or the browser — would observe: the element emitted, its classes, the
declarations present and absent on the style attribute, and the declarations the
stylesheet holds. It does not assert a computed layout, which no DOM in this repo
can produce, and it does not reach into a table of values the code no longer has.

Three seams exist and none is added.

- **Block render (highest).** Props in, markup out. Covers: a freshly dropped
  Button carries the default variant's class and no variant Style variable
  inline; each variant carries its own class; an authored Decoration or Typography
  value still appears inline and still holds at its Breakpoint; an unknown stored
  variant renders with the default variant's class; the anchor and the text
  fallback carry the same root classes; the canvas and the published page emit
  identical markup. Prior art: the existing Button block render test.
- **The stylesheet as data.** Covers: one rule per Variant carrying its base
  declarations and the state declarations it dictates; the base-box rule
  declaring the four paddings; every rule in both families declaring only custom
  properties, with no `!important`; the hover rule unchanged, still reading the
  state's variables and still deriving from the base background; no state rule
  redefining a base variable. Prior art: the stylesheet rule reader the hover and
  breakpoint-ladder tests already use.
- **The panel as data.** Covers: the field set and its order unchanged, and the
  copy that names where the unset values come from. Prior art: the content
  field's order test.

What a unit test cannot prove is claimed by hand: the four variants read the same
in the canvas and on the published page after the paint path changes, and the
hover still settles where it did. No browser probe: it reports events, not
computed colour.

## Out of Scope

- Moving the other blocks' default props into their classes. A block that needs a
  class-owned starting look brings its own arguments; the block system is not
  redesigned here.
- Author-defined, saved or per-Breakpoint Variants. A saved Variant would have to
  generate a rule; it was out of scope before this decision and stays out.
- States beyond hover, and any state control in the panel.
- The Button's Width, or any other block constant, moving into the stylesheet.
- A panel control that shows an inherited value as a placeholder.
- Unifying the NavbarBlock's call to action with the Button block.
- A size control, and the semantic variants the block does not offer.

## Further Notes

- Predecessor: `.scratch/puck-button-block/`. This spec supersedes that spec's
  paragraph asserting that the Variant is stored as the same props the author
  edits and never as a stylesheet class, and the acceptance criterion in its
  ticket 03 that says no stylesheet class carries a variant's look. That folder
  stays closed and unchanged; the ADR is the record of the reversal.
- The ADR is written before the tickets, as the predecessor's was.
- The numbers that motivated this: 44 inline declarations on a fresh primary, 39
  of them the variant, identical on every instance; ~1.1 KB uncompressed per
  Button, which Brotli compresses well but which costs legibility in every DOM
  that holds a call to action.
- The two tickets are ordered so that the same stylesheet section and the same
  test file are not edited twice in parallel, not because one needs the other's
  behaviour.
