---
Status: ready-for-agent
Type: spec
---

# The last pass before production: one layout block, one control box, one way to edit a list of links

## Problem Statement

Seven small things stand between the current branch and production. None is a
feature; each is a place where the editor says something that is not true, or
where the same value has two sources.

**A layout block that lies about itself.** The palette offers three tiles —
Container, Flex and Grid — and they are the same block three times. Their field
sets are identical; the only difference is a default value for the display mode,
and the Layout control already offers Block, Flex and Grid on every one of them.
Because Puck writes a block's defaults into the document when it is inserted,
"being a Flex" is one stored value that the panel invites the author to change —
and the layer tree keeps calling it Flex after it has become a Grid. Three tiles
promise three things and deliver one, and the name in the outline is false the
moment the author uses the control in front of them.

**Panel controls that are not one size.** In the properties panel a text field
renders 32px and a select in the same section renders 36px. The cause is not a
local mistake: the input takes its height from a plain utility, the select from a
size variant, and the size the panel asks for is not one the vendor offers. The
panel writes the height into the class list, the variant outranks it, and the
mismatch appears wherever the two controls meet. Everywhere else in the backoffice
the controls agree at 36px, so the panel is the only place the defect is visible.

**A value that escapes its control.** A link destination with a long title paints
outside the picker that holds it, in the panel and in every admin picker built on
the same component.

**One field is not like the others.** The Heading's level is the last control in
the block registry that uses one of Puck's native field types, so it does not
share the panel's grammar, its reset affordance, or its size.

**A link in a list is edited unlike a link in a menu.** The footer's Link list and
Copyright mount one full link editor per row inside the properties panel, with no
draft and no cancel: a mistake is permanent as it is typed. The navigation block
already does the same job in a dialog with Save and Cancel. The footer blocks are
the taller, riskier of the two.

**A palette that ignores its own configuration.** The Elements panel draws
whatever the config registers, in one flat group under a decorative heading,
with a search box that does nothing and a tab with no content. The categories the
page config declares and the ones built for every Site region are read by nobody.

## Solution

One Container. One compact control box for the panel. One dialog for a list of
links. One palette drawn from the categories that already exist.

Flex and Grid are retired rather than hidden: their stored nodes are rewritten to
a Container, with the effective display mode written into the document first,
because a node that relied on its defaults would otherwise turn from a grid into
a column of blocks. The two blocks, their palette entries and their render
entries go; the documents keep their content, their props and their look.

The panel owns its compact size. One module defines the box its controls share;
the input takes it as a class and the select takes it as a size plus the padding
and text that size does not change. The vendored primitives are not edited, so
reinstalling them stays safe. Admin is untouched: at 36px it is already coherent.

The picker truncates its value in the shared component, so every picker in the app
inherits the fix. The Heading's level becomes a custom field and moves after the
content, following the order every other block uses. The footer's links move into
a dialog with the navigation's chrome — draft, Save, Cancel — over the flat list
of links the footer blocks actually hold. And the palette becomes the categories,
with a search that filters it.

## User Stories

1. As a backoffice editor, I want one tile called Container in the palette, so
   that I stop choosing between three names for one thing.
2. As a backoffice editor, I want every layer tree row to say Container, so that
   the outline never names a layout mode the block no longer has.
3. As a backoffice editor, I want the Display control to be the only place where
   Block, Flex and Grid are chosen, so that switching between them is a property
   and not a replacement.
4. As a backoffice editor, I want to drop one container and pick its display
   mode, so that I do not have to remember which tile to start from.
5. As a backoffice editor, I want every page that already uses Flex or Grid to
   look exactly as it looks today, so that the change is invisible on the site.
6. As a backoffice editor, I want the children of an existing Flex or Grid to
   keep their order, their spacing and their sizes, so that a retirement of a
   block type is not a redesign of my page.
7. As a backoffice editor, I want a container whose display I never set to keep
   rendering the way it rendered, so that the defaults that were injected at
   render time are not lost in the rewrite.
8. As a backoffice editor, I want the panel's text fields and selects to be the
   same height, so that a form does not look broken.
9. As a backoffice editor, I want them to share the same text size too, so that
   fixing the height does not move the mismatch to another axis.
10. As a backoffice editor, I want a long destination to end in an ellipsis
    instead of escaping its control, so that the panel stays inside the panel.
11. As a backoffice editor, I want the picker's chevron to stay put while the
    value gives way, so that the control still looks like a control.
12. As a backoffice editor, I want the Heading level to look and behave like
    every other control, so that the panel has one grammar.
13. As a backoffice editor, I want the heading's content before its level, so
    that the first control in a block is the thing I came to write.
14. As a backoffice editor, I want to edit the footer's links in a dialog with
    Save and Cancel, so that a mistake is one Escape away.
15. As a backoffice editor, I want the same dialog for Link list and Copyright,
    so that the two footer blocks are learned once.
16. As a backoffice editor, I want to add, remove and reorder links inside that
    dialog, so that the list is managed in one place instead of around a form.
17. As a backoffice editor, I want an empty link list to open on an empty state
    with Add available, so that I always know how to start.
18. As a backoffice editor, I want the panel to summarise how many links the
    block holds, so that a collapsed section still tells me something.
19. As a keyboard user, I want reordering a link not to steal my focus, so that I
    can move an item twice without hunting for it again.
20. As a backoffice editor, I want the palette grouped by category and findable
    by typing, so that I do not scroll a flat list of cards.
21. As a backoffice editor, I want a search with an empty state, so that a
    missing block reads as "not here" and not as a broken panel.
22. As a backoffice editor, I want no tab I can open that shows nothing, so that
    the panel does not waste a click.
23. As a visitor, I want nothing on any page to move, so that the last pass
    before production is invisible to me.
24. As a maintainer, I want the palette to be the categories and the component
    map to be everything a document may contain, so that a block can be retired
    without a document losing its content.
25. As a maintainer, I want a native field to fail the suite, so that the
    custom-field grammar cannot be abandoned by accident.
26. As a maintainer, I want the compact size in one module, so that the next
    panel control inherits it and no vendored file is patched.
27. As a maintainer, I want the retirement paired with a dry run that names each
    changed version, so that a one-off edit of published documents is reviewable
    before it happens.
28. As a maintainer, I want that migration to be idempotent, so that running it
    twice is harmless.
29. As a maintainer, I want to know in which order to run the migration and the
    deploy, so that no visitor sees a not-found box.
30. As a maintainer, I want the panel's labels in one case, so that the copy
    reads as one hand wrote it.
31. As a maintainer, I want the record of why one block ever had three
    registrations, so that the next reader does not reinvent them.

## Implementation Decisions

**One block, and the palette is the categories.** A container is a block whose
display mode is a property; the palette shows one tile and the Layout control
chooses Block, Flex or Grid. The panel derives its entries from the config's
categories rather than from the registered components, because the component map
has to keep every type a stored document may contain: a registered-but-unlisted
component still renders, while an unregistered one renders a not-found box and
drops its children. Categories are therefore the author-facing surface and the
component map is the document's vocabulary. Every editor config that can be
loaded declares categories, so no fallback branch is introduced.

**The retirement is a document migration, not a hidden alias.** The two block
types are deleted from the registry after their stored occurrences are renamed.
Keeping them as invisible aliases was considered and rejected: an alias keeps the
name in the code, needs the palette to hide it forever, and reproduces the
inconsistency the palette is meant to remove.

**The migration writes the effective display before renaming.** A stored
Flex/Grid node may carry no layout at all — the value it renders with comes from
the block's defaults at render time — so the transform fills the desktop display
with the mode the node used to have and then changes the type. A rung that
already declares a display is left alone, because the responsive ladder already
carries it to the narrower ones. The transform is pure and idempotent; the runner
scans every Page and Site region version — drafts, current, live and history —
reports each changed version with the nodes it touched, keeps going after a
failure, and writes nothing in dry run. It follows the shape of the existing
Puck document migration in the repository rather than generalising it: one new
migration is not a reason to refactor a shipped one.

**The migration runs before the deploy.** The current code renders a Container
correctly, so the documents can be rewritten while it is live; deploying the
deletion first would leave a window in which published pages render a not-found
box. The operations runbook gains that sentence.

**The panel's compact size is a panel module.** One module exports the box the
panel's controls share: 32px, the panel's horizontal padding, and the panel's
text size. The input receives it as a class; the select receives the vendor's
small size — its height must come from the size variant, because a variant
outranks a plain utility, which is the whole reason the two controls disagreed —
plus the padding and text that the size does not change. The vendored primitives
are not edited, and the coding standards gain the line that says so, because a
local patch to them is erased the next time the component is reinstalled.

**The picker truncates centrally.** The value gets a minimum width of zero and an
ellipsis, the icon is told not to shrink, and the fix lives in the shared
component rather than in the one panel field that surfaced it.

**The Heading's level is a custom field, placed after the content.** It reuses
the shape the block content fields already use, including the header and the
reset that returns the default level. A registry-level test fails on any block
field that is not a custom field or a slot, so the grammar is enforced rather
than remembered.

**The dialog shares chrome, not model.** The navigation dialog edits a typed tree
of links, columns, cards and calls to action; the footer dialog edits a flat list
of Smart links. They share the two-pane shell, the local draft, the Save and
Cancel semantics, the discard on Escape and overlay, and reordering that keeps
the selection; they do not share the item model. The inline editor is deleted and
the panel keeps a header, a reset and a summary.

**The starting-look boundary is written where it is read.** A maintainer looking
for "why is the Button different" should find the answer next to the defaults
that define all the other blocks, not in an ADR they have to know about.

**The panel's copy is sentence case**, with initialisms kept. This is a change of
case, not of words: no label is renamed.

## Testing Decisions

A good test here drives the thing from its inputs and asserts what a reader of
the page or of the panel would observe: the element emitted, the classes it
carries, the declarations present and absent, the categories listed, the report a
migration prints. It does not assert a computed layout, which no DOM in this
repository can produce, and it does not reach into internals that the change
exists to remove.

Three seams exist and none is added:

- **Block and registry (highest).** Props in, markup or registry out. Covers: a
  Container rendering the same markup from what a retired Flex or Grid document
  held; the Heading emitting its level from the custom field; every block field
  being a custom field or a slot; every editor config declaring categories and no
  category listing a retired block. Prior art: the Button, Heading and palette
  suites.
- **The document migration as a pure function.** Fixtures in, document plus report
  out. Covers: a node with no layout at all — the shape the development database
  actually holds; a node whose desktop rung already declares another display; a
  node nested in a zone; props preserved; a second run reporting no changes. Prior
  art: the size/spacing migration suite.
- **The panel as data.** The panel and the dialog driven through their props.
  Covers: the compact class on the controls, the field order, the truncating
  wrapper, groups and search results in the palette, and for the dialog: draft
  discarded on cancel, committed on save, selection kept across a reorder, empty
  state. Prior art: the link editor, menu dialog and field-order suites.

What a unit test cannot prove is claimed by hand, once: a text field and a select
in the same panel section render the same height, and one admin form still looks
as it did.

## Out of Scope

- Any other block's starting look moving into a class. The boundary recorded for
  the Button (ADR-0045) holds; the Top bar and the Separator keep their default
  props.
- A size on the input primitive, or any other edit to the vendored primitives.
- Sweeping admin call sites: they are coherent at 36px and are not touched.
- A guard that forbids height classes in call sites; one line in the coding
  standards replaces it.
- Per-instance names in the layer tree, or a custom outline.
- Presets: a saved Container configuration the author can reuse.
- A typed item model in the footer dialog: no columns, cards or calls to action.
- Any new block, field, stored value or schema change.

## Further Notes

- **The count this rests on.** When this spec was written, the development
  database held 15 Page versions and 35 Site region versions, and one published
  Page version contained 18 Grid nodes with no Flex anywhere. The dry run run
  with ticket 06 reported 16 Page versions, 35 region versions and 9 Grid nodes,
  all in the same single Page version: the fixture moved, the shape did not.
  Those nodes carry an id, their children, a size and a spacing — and no layout —
  so their grid comes entirely from Public defaultProps. That is the case the
  migration exists for, and it is the one a plain rename would break. Production
  is not reachable from here: this is a development-database count, and the
  production run is a separate, human-supervised step.
- **The record.** ADR-0046 records the decision and the glossary carries Container,
  with the Block root entry no longer naming the retired blocks. Both land with
  this spec: they are read by the tickets, not delivered by one.
- **Ordering.** The tickets on the frontier, in number order. The palette becomes
  the categories before the blocks are deleted, so the panel never offers a tile
  whose block is gone.
