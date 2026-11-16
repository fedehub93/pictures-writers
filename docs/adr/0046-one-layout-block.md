# One layout block: a container's display mode is a property, not a block type

**Status**: accepted.

`Container`, `Flex` and `Grid` are three registrations of one component. Their
field sets are identical; the only difference is a `defaultProps` value that
selects the display mode, and the Layout field already offers Block, Flex, Grid
and None on every one of them. Because Puck copies a component's `defaultProps`
into the document when it is inserted, "being a Flex" is one stored value the
panel invites the author to change — and the layer tree names a component by its
config's `label`, so a Flex switched to Grid keeps saying Flex. The name is a
function of the stored type and the stored type is the property the control in
front of the author changes; the two cannot stay true at once.

So a container is one block, and its display mode is a property. The palette
offers one Container tile and the Layout control chooses Block, Flex or Grid; the
outline says Container for every container, which is what the block is, and stops
naming a mode, which is what the block does.

The palette is drawn from the config's categories, not from the registered
components. Those are two different questions and they need two different
answers: the component map must keep every type a stored document may contain,
because Puck renders an unregistered component as a placeholder that says the
component was not found and, in doing so, renders none of its children; the
categories are what the author is offered. A block therefore leaves the palette
when it leaves the categories, and leaves the code when no document contains it
any more.

Removing the two types therefore requires rewriting the documents that hold them,
and the rewrite must write the display mode into the node before it changes the
type. A stored Flex or Grid node may carry no layout at all: the mode it renders
with arrives from the block's default props — Puck applies them in the canvas,
and the public render path applies the same ones through a shared helper.
Renaming such a node without writing the value would turn a page of sized grids
into a column of blocks — a silent redesign, in a change whose whole point is to
be invisible. The migration
fills the desktop rung when no rung declares a display. It leaves an authored
display alone because a stored `layout` replaces the block defaults wholesale
through the shallow merge both render paths use: a node whose ladder carries a
display was never rendered with the type's default, so writing one would
overwrite an authored value or invent a desktop value the document did not have.
The transform is idempotent, so a second run reports nothing.

## Considered options

- **Keep the three tiles.** Rejected: they promise three things and deliver one,
  and the name in the outline contradicts the control in the panel.
- **Keep the types, hide them from the palette, label them all Container.**
  Rejected: an alias keeps the name in the code, keeps three configs to maintain,
  and reproduces in the registry exactly the inconsistency the palette exists to
  remove. It was the cheap option, not the correct one.
- **Label the layer tree per instance instead** — "Container · Flex" — with a
  custom outline. Rejected: the outline exists to navigate the tree, not to read
  the box model, and Puck's label is a static string per component, so this buys
  a fork of the outline for a detail the panel already shows.
- **Delete the blocks and rewrite nothing.** Rejected outright: every document
  holding a Flex or Grid would render a not-found placeholder, and its children
  would disappear with it.
- **Rename the type only, without writing the display.** Rejected for the reason
  above: the nodes in the database may rely entirely on the block's defaults, so
  the rename alone changes how the page looks.

## Consequences

- Stored documents are rewritten once, across every Page version and every Site
  region version, published snapshots included. The result is visually identical,
  so this is a normalisation of the representation and not a rewrite of history;
  it is still a write to published rows, which is why it ships as a dry run first
  and a report of every version it touched.
- The migration runs before the deploy that deletes the blocks, while the
  current code is live: that code renders a Container correctly. Deploying first
  leaves a window in which published pages show a not-found box.
- The palette has to be the categories before the deletion lands, or the panel
  would offer a tile whose block no longer exists.
- The author trades a tile for a control: drop a Container, then pick its display
  mode. It costs one interaction and removes a name that can be wrong.
- The tests that enumerated three layout blocks now assert one, and that one
  renders the same markup from what those documents still hold.
- `GLOSSARY.md` → "Container"; "Block root" stops naming the retired blocks.
- [ADR-0038](./0038-responsive-visibility-on-the-block.md) and
  [ADR-0040](./0040-one-element-tree-in-canvas-and-page.md) keep describing the
  three registrations as they were. Their behaviour — responsive display on the
  block, one tree in canvas and page — survives in the one Container; this
  decision retires only the enumeration.
