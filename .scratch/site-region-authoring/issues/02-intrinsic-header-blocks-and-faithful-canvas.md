---
Status: done
Type: task
Blocked by:
---

# Intrinsic header blocks and a faithful canvas

## Goal

Make the Header row behave the same in the canvas and on the public site, so alignment is controlled by the parent's `justify` instead of hidden defaults in individual blocks.

## Acceptance criteria

- [x] `LinkBlockUi` no longer wraps the anchor in a full-width `div`; the anchor keeps `puck-dim puck-typo puck-deco` and sizes itself.
- [x] `NavbarBlockUi` no longer starts with `flex w-full items-center justify-end`; it is an intrinsic item and inherits alignment from its parent.
- [x] Container and Flex stop injecting `flex-1` on every direct child while editing. Selection and drop affordances still work on an empty slot.
- [x] A Container with `display: flex; justify-content: space-between` holding Brand, NavbarBlock and Link places the three items identically in the canvas and on the public site, at desktop, tablet and mobile.
- [x] An existing page composition whose Container is `display: block` renders unchanged.
- [x] Tests: link block emits no `w-full` wrapper; navbar block root has no `w-full`/`justify-end`; Container/Flex emit no `flex-1` selector in edit mode; the render-pipeline parity test still passes.

## Implementation notes

- **Link.** `LinkBlockUi` returns `InlineSmartLink` directly. The anchor keeps `puck-dim puck-typo puck-deco inline-block`; it is intrinsic and sizes to its content instead of stretching a wrapper.
- **Navbar.** `NavbarBlockUi` now renders its single `puck-dim puck-deco` root. The `flex w-full items-center justify-end` wrapper is gone, so the block is an ordinary flex item and alignment comes from the parent.
- **Canvas parity.** `renderContainerBlock`, `renderFlexBlock` and `renderGridBlock` no longer pass the editor-only `[&>[data-puck-component]]:flex-1` (and separator `self-stretch`) selector. Grid shared the same injection and is included so all three layout blocks behave consistently. The now-unreachable `className` prop was removed from the three layout UIs.
- **Selection and drop.** No editor-shell chrome was needed. Puck's `DropZone` already gives an empty slot a `min-height` and dashed hit area (`._DropZone:empty`), and `[data-puck-component]` keeps intrinsic-size blocks selectable and draggable. The removed `flex-1` was not the affordance that makes an empty slot droppable.
- **`puck-base.css` audit.** `.puck-dim` sets `width: var(--w-d) !important`; an unauthored value resolves to `initial` (i.e. `auto`), so an intrinsic block keeps its own size. No other rule assumes a full-width block root. Separator and Image still declare their own full width by design; they are page/footer blocks outside this ticket.

## Verification

- `npx tsc --noEmit` clean.
- `npm run test:run -- src/puck/__tests__/render-pipeline.test.tsx src/puck/__tests__/link-block.test.tsx src/puck/__tests__/navbar-block.test.tsx`: 35 tests pass.
- Full `npm run test:run`: 225 files / 1873 tests pass.
- ESLint on the changed files is clean; repo-wide lint still reports unrelated pre-existing errors.
