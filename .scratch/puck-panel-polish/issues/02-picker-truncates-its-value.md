# 02: A picker's value never escapes it

**What to build:** A command picker whose selected value ends in an ellipsis
instead of painting outside the control, in the properties panel and in every
admin picker built on the same component. The value gives way, the icon keeps its
place, and the placeholder behaves like a value. The fix lives in the shared
component rather than in the one panel field that surfaced it.

**Blocked by:** 01 — the same picker's class list, so the two tickets would edit
it twice. A sequencing edge, not a behavioural one.

**Status:** done

- [x] A destination title longer than the picker is clipped with an ellipsis and
      stays inside the border, at the panel's width.
- [x] The same holds in an admin picker that uses the shared component.
- [x] The icon never shrinks and never overlaps the value.
- [x] The placeholder follows the same rule.
- [x] A render test pins the truncating wrapper, so a refactor cannot drop it
      silently.
- [x] Typecheck, lint and the full test suite pass.

## Comments

**2026-11-16 — bd2aec77**

`src/shared/components/command-select.tsx` now wraps the selected value, or the
placeholder, in `min-w-0 truncate`, and marks the chevron `shrink-0`. The zero
minimum width is the part that matters: without it the flex item refuses to
shrink below its text and the title paints over the button's border. The fix is
in the shared picker, so the properties panel's link destination, its form picker
and every admin picker built on the component inherit it. No call site changed
and nothing under `src/shared/ui/` was touched.

`flex-1` was deliberately left out. A headless-Chrome check of the same markup
at a 200px button showed `min-w-0 truncate` alone ellipsises both a value and a
placeholder while the icon keeps its place; the spec asked for a minimum width
and an ellipsis, and a third property earned its way in only if it changed the
outcome, which it did not.

`src/shared/components/__tests__/command-select.test.tsx` drives the picker
through its props and pins the wrapper for the panel's box, the placeholder and
an admin invocation (the reviews product filter's `h-8 max-w-60`), plus the
icon's `shrink-0`. Before the fix the value div emitted no class at all, so all
four tests failed.

A limit worth knowing: `truncate` ellipsises the wrapper's own inline content,
which is what the panel's destination (`<span>`) and the admin pickers that pass
a title as a span supply. Admin options that pass a nested flex row
(`form-id-filter.tsx`, `form-view.tsx`, the status filters with icons) still stay
inside the border but clamp without an ellipsis, because a flex container's text
is an anonymous item and `text-overflow` never reaches it. Making those
ellipsise would mean restyling the options' children from the shared component
or editing admin call sites, both outside this ticket.

Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265 pre-existing
warnings); `npm test` 266 files, 2359 tests passed. No agent-environment browser
probe ran: the panel's computed width is not reproducible in the test DOM and the
agent seed page holds no link block. The truncation mechanism itself was checked
in headless Chrome against the same markup and class list — ellipsis on the value
and on the placeholder, icon pinned to the right — not against the running
editor.
