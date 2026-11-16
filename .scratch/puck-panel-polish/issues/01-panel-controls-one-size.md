# 01: The panel's controls are one size

**What to build:** A properties panel in which a text field and a select in the
same section are the same control: same height, same text size, same horizontal
padding. One module owns that compact box; the panel's text field, its selects,
its unit input and its command picker all take the box from there and none of
them writes a height of its own. The select takes its height from the vendor's
small size rather than from a class, because that is the mechanism the class was
losing to. The vendored primitives stay untouched and admin keeps its 36px, so a
reinstall of a primitive is still safe.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] A text field and a select in the same panel section render at the same
      height, the same text size and the same horizontal padding.
- [x] One module defines the compact box; the panel's input, its selects, its
      unit input and its command picker all use it, and no panel control writes
      a height of its own.
- [x] The select's height comes from its size, not from a class that a size
      variant outranks.
- [x] No vendored primitive and no admin call site is modified.
- [x] The coding standards gain the line that the vendored primitives are not
      edited.
- [x] Typecheck, lint and the full test suite pass.

## Comments

**2026-11-16 — f207fa60**

The panel now has one compact box. `src/puck/components/panel-control.tsx` exports
`PANEL_CONTROL` — the whole box (`h-8 px-2 text-xs!`), its height alone, and the
picker's box — plus `PanelSelectTrigger`, which takes its height from the
vendor's `sm` size variant rather than a class. The text field, every panel
select (the shared select field, the link field, the size field, the navbar CTA),
the unit input, the command picker, the segmented control and the colour input
take it, and the loading skeletons match the height they replace. No file under
`src/shared/ui/` and no admin call site changed; `CODING_STANDARDS.md` now
records that the vendored primitives are not edited.

The picker's padding needed the same treatment as the select's height: its
Button pads itself `has-[>svg]:px-3` for the icon, so the panel states
`has-[>svg]:px-2` on the same variant. A plain `px-2` was present in the class
list and still lost — the test now pins the variant that wins.

`src/puck/__tests__/panel-control-size.test.tsx` drives the panel's fields
through their props and asserts the emitted box, the select's `data-size="sm"`
with no height class of its own, and that an admin picker keeps the vendor's
36px. A browser probe on the agent environment measured a text field, a select
and the command picker in one panel section: 29.44px high, 12px text and 7.36px
left/right padding each — identical, at the editor's 0.92 scale (32px, 12px,
8px at 1:1). Before this change the select was taller and the picker's padding
was 12px.

Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265 pre-existing
warnings); `npm test` 265 files, 2355 tests passed.
