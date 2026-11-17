---
Status: ready-for-agent
Type: spec
---

# The last two: the outline scrolls, and every panel control has one fill

## Problem Statement

Two defects remain in the editor, both reported from the same screenshot of the
page builder.

**The outline cannot be scrolled.** On a document whose layer tree is taller
than the left column, the Outline tab grows past the column and the rows below
the fold are unreachable: no scrollbar appears anywhere. The Widgets tab in the
same column scrolls correctly, and so does the properties panel on the right.
`Puck.Outline` is not at fault — its own layers container already declares
`flex-grow: 1; min-height: 0; overflow: auto`. The tab it is mounted in is the
fault: the tab it is mounted in is the fault: the classless
`TabsContent value="outline"` in `src/puck/editor/ui/view/sidebar.tsx` stays
`display: block` and, as a flex item with `min-height: auto`, it takes its
content's height instead of the remaining height of the tabs. The inner layers
container then grows with the tree, `scrollHeight` equals `clientHeight`, the
scrollbar never appears, and the excess is clipped by the `overflow-hidden` on
the column in `editor.tsx`.

**Two controls in one panel section disagree on their background.** A text
field and a select in the properties panel are transparent — they show the
surface they sit on — while a unit input, a segmented control and a picker are
painted `bg-background`. On the panel itself the difference is a 1.5% lightness
step; inside a `bg-muted/60` group (Spacing, Decoration → Border, Layout) it is
the whole point: the transparent controls darken with the group while the
opaque ones stay light, so Border shows four light unit chips next to a select
that turned grey. The panel is the only surface where this is visible because
it is the only one that draws controls inside muted groups; nothing in the repo
restyles Puck, and the shared primitives were never touched.

A third, smaller defect sits in the same two files: the editor declares
`h-[calc(100vh-3.75rem)]` while the admin header it sits under is `h-16`
(64px), so the editor is 4px taller than its container and the admin scroller
absorbs the difference.

## Solution

Give the Outline tab the same height contract the Widgets tab already has, give
every panel control the same fill through the module that already owns the
panel's box, and make the editor's height arithmetic agree with the header.

The Outline is not re-implemented and its internals are not styled. The tab
becomes a flex column that fills the remaining height and hides its overflow;
Puck's own layers container, already written as a growing flex child with
`min-height: 0`, then has a definite height to scroll within. The scrollbar is
the browser's: matching the Widgets tab's Radix `ScrollArea` would mean
disarming Puck's `overflow: auto` — an unlayered rule that only `!important`
outranks — and nesting two scrollers to gain a thumb.

The fill is one token in `PANEL_CONTROL`, the module that defines the box the
panel's controls share. It does not come from the surface behind it: the
invariant this fixes is that a control looks the same wherever it is nested,
and a fill inherited from the surface changes shade as the surface does. In the
light theme the token is opaque; in dark it is the same translucent tint the
text primitives carry, over two surfaces about 1% apart. The token is
applied at the call sites that own their border — the text input, the select
trigger, the colour field, the unit input's group, the segmented control, the
picker and the two textareas — because the vendored primitives in
`src/shared/ui/` are not edited (`CODING_STANDARDS.md`). The muted groups stay:
they were never the defect, the controls that ignored them were.

The editor's height becomes `calc(100vh - 4rem)`, the admin header's real
height, so the columns fill exactly the content area instead of overshooting it
by 4px.

## User Stories

1. As a backoffice editor, I want the Outline tab to scroll, so that a long
   document's layers below the fold are reachable.
2. As a backoffice editor, I want the Outline's own header (Collapse all) to
   stay pinned while the tree scrolls, so that the control does not move away.
3. As a backoffice editor, I want the Widgets tab, the canvas and the properties
   panel to behave exactly as they do today, so that fixing one tab does not
   disturb three surfaces.
4. As a backoffice editor, I want every control in the properties panel to have
   the same background, so that a section does not look assembled from two kits.
5. As a backoffice editor, I want a control's contrast not to depend on the
   group it is drawn in, so that a light chip stays a light chip on a grey group.
6. As a backoffice editor, I want the editor's columns to fill the screen
   exactly, so that the outline's new scrollbar is not pushed off by 4px.
7. As a maintainer, I want the shared box module to own the fill too, so that
   the next panel control inherits it instead of choosing one.
8. As a maintainer, I want the vendored primitives untouched, so that
   reinstalling them stays safe.

## Implementation Decisions

**The tab, not the outline.** The fix is `flex-1 m-0 min-h-0 overflow-hidden`
plus a flex column on the Outline `TabsContent`, mirroring the Widgets one
(`data-[state=active]:flex` included, for the same reason it is there today).
No wrapper element is added, no class is written against a Puck CSS-module hash,
and no `!important` is introduced. The contract is documented with a comment
next to the JSX, because the next reader will wonder why a tab needs `min-h-0`.

**The fill is a token, not a sweep.** `PANEL_CONTROL.fill` is
`bg-background dark:bg-input/30` — the two values the text primitives already
use, so the panel's chip is the same object as a text field elsewhere in the
admin. It is applied to controls that own their border and is deliberately
**not** folded into `PANEL_CONTROL.box`: the unit input's inner `<input>` also
takes `box`, and painting it would stack a second translucent layer over the
group in dark mode.

**The picker already complies.** `CommandSelect` and the icon picker draw a
`Button variant="outline"`, which already carries `bg-background` and its dark
tint, so the picker box token is left alone and no `bg-transparent` override is
added anywhere.

**The editor height is corrected to the header.** One utility in `editor.tsx`.
`post-id-view.tsx` already uses `calc(100vh-64px)` for the same reason.

## Testing Decisions

The panel is tested as data, following the suite that already exists
(`src/puck/__tests__/panel-control-size.test.tsx`): render the field through its
props and read the class it emits. The fill gets the same treatment — a field, a
select, the unit group, the segmented control, the colour field, the custom
ratio input and the picker each carry `bg-background`, and none carries
`bg-transparent`, which `twMerge` would have removed.

What a DOM in this repo cannot produce is a computed layout, so the scroll is
verified by hand in the browser: the Outline tab of a long document reports
`scrollHeight > clientHeight` on Puck's layers container, the header stays
fixed, and the Widgets tab and the right panel still scroll as before.

## Out of Scope

- Restyling Puck's outline, or any selector written against its CSS-module
  hashes.
- A Radix `ScrollArea` inside the Outline tab.
- The admin leftovers that are a different defect: the native `<select>` in
  `invite-user-dialog.tsx` and the `bg-zinc-300/50` controls in the media
  modals. Recorded as known debt, not fixed here.
- The icon picker's height: it remains the vendor's, as the size ticket left it.
- Any change to the muted group fills, the panel's own `bg-sidebar` surface, or
  the vendored primitives.
- Per-instance names in the layer tree, or a custom outline.
