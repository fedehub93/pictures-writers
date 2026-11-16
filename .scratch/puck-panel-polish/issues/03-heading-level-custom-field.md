# 03: The Heading's level is a custom field, and the content comes first

**What to build:** The Heading's level becomes a custom field, so it carries the
panel's header, its reset to the default level and the panel's control grammar
like every other field. It moves after the content, which is the order every
other block follows. And the grammar stops being a habit: a registry-level test
fails on any block field that is not a custom field or a slot.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] The level control offers the same levels as today and looks like the
      panel's other controls.
- [x] Its reset returns the default level, and a document that stored no level
      keeps rendering the default.
- [x] The Heading's field order is content, level, layout, size, spacing,
      typography.
- [x] A test walks every block config and fails on a field that is neither a
      custom field nor a slot, naming the block and the field.
- [x] The heading suite drives the level through its props instead of asserting
      a native field type.
- [x] Typecheck, lint and the full test suite pass.

## Comments

**2026-11-16 — 7e543c27**

The Heading's level is now `HeadingLevelField` in
`src/puck/blocks/Heading/field.tsx`: a custom field that renders `PropHeader`
plus a select on `PanelSelectTrigger`, so it shares the panel's header, reset
affordance, compact box and `sm` select size. The reset clears the authored
value (`onChange(undefined)`), which leaves the render's `h2` fallback in
charge; the reset is offered for an authored level other than the default, the
same rule the SearchBar content field uses so a freshly inserted block (Puck
writes `h2` into the document at insert) does not show a reset it never earned. `text` moved ahead of `level`, giving the order text, level,
layout, size, spacing, typography.

`resolveHeadingLevel` in `Heading/level.ts` is now the one rule for a stored
value outside the allow-list, called by both the render and the field. The
render's dynamic tag moved to `createElement` because the compiler lint reads a
capitalised variable assigned from a call as a component created during render;
the emitted markup is unchanged and the heading suite pins it.

`src/puck/__tests__/block-field-grammar.test.ts` walks every block in
`editorComponentConfigs` and fails on a field that is neither custom nor a slot,
naming the block and the field. The rich text field is the one exception: it is
authored on the canvas and sets `visible: false`, and the exemption is keyed on
that type rather than on visibility, so a hidden native control still fails.
The heading suite no longer asserts a field type (the grammar test owns that);
it drives the field through its props to check the control box, the reset, and
the default the panel shows for an unknown stored value.

Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
pre-existing warnings); `npm run test:run` 267 files, 2365 tests passed. No
browser probe ran: the ticket changes a panel control, not a page, and the
control's box is the one ticket 01 already measured by hand; the class list is
pinned here and in `panel-control-size.test.tsx`.
