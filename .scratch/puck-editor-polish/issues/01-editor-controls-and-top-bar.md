# 01: Editor controls and Top bar

**What to build:** The shared editor controls stop clipping long labels and speak English, and the Announcement bar becomes a generic Top bar. An editor can add a Top bar, drop arbitrary blocks into it, optionally make it dismissible, and see it behave correctly in the canvas and on the public site. The old Announcement bar disappears from the registry, the palette and the render config.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The SegmentedControl fits long labels in the narrow properties panel (small type, tighter horizontal padding, truncation) without changing the behaviour of its existing uses.
- [x] The link field's "open in new tab" choice is a Switch with an English label.
- [x] Every label and placeholder in the link field is English, including type, opening, destination and the empty-label hint.
- [x] A shared content-field wrapper exists and is used by the Top bar settings section, so block content sections share the same accordion, icon and property-header convention.
- [x] The block key `TopBar` replaces `AnnouncementBar` in the component registry, the Header palette, the editor icon/label table, the public render config and the tests; no Announcement bar entry remains.
- [x] The Top bar exposes a `content` slot for arbitrary blocks, a `settings.dismissible` flag, and the shared dimension and decoration fields.
- [x] The Top bar default is a neutral full-width strip with horizontal and vertical padding and no background.
- [x] An empty Top bar renders nothing on the public site and shows an editable slot in the canvas.
- [x] Dismissal is stored per block id; a dismissed bar stays visible in the canvas and is hidden for returning visitors; the old content-hash behaviour is removed.
- [x] Tests cover slot content, the empty slot, dismissal on and off, editing-mode visibility, and the dimension/decoration variables; palette tests assert that the Top bar is header-only.
- [x] Type checking, targeted linting, the full test suite and the production build pass.

## Implementation notes

- `src/puck/utils/with-content-field.tsx` wraps the existing accordion field with a typed nested-object contract (`value`, `update`, `reset`). The Top bar settings section is the first consumer.
- `src/puck/blocks/TopBar/` replaces `AnnouncementBar/`: the block is a `content` slot with a custom `settings` section, shared dimension/decoration fields, and no `text`, `link` or typography props.
- The public strip carries the `puck-top-bar-public` class and `puck-base.css` hides it when the slot is empty. The editor canvas never receives that class, so an empty bar keeps its drop zone.
- Dismissal storage is scoped by block id only (`puck:top-bar:dismissed:<id>`); the content hash and its utility are gone. `shouldHideTopBar` keeps the canvas visible regardless of stored dismissal.
- `src/puck/components/switch-input/index.tsx` provides the shared boolean control used by the link opening setting and the Top bar dismissal setting. The link field labels and placeholders are now English.
- `SegmentedControl` now uses `min-w-0`, smaller type, tighter horizontal padding and truncated labels; icon-only uses are unchanged.
- Tests: `top-bar-block.test.tsx` covers slot content, the empty public/canvas split, dimension/decoration variables, neutral defaults, dismissal on/off and editing-mode visibility; `top-bar-storage.test.ts` covers per-id keys and same-tab subscriptions. Palette and render-config tests assert the Top bar is header-only and absent from pages.
- Verification: `npx tsc --noEmit`, targeted `npx eslint`, `npm run test:run` (221 files / 1828 tests) and `npm run build` pass.

## Notes

- The Top bar is a container, not an announcement: no `text` or `link` props survive.
- Migrating old Announcement bar documents is intentionally out of scope; the block is recreated in the editor.
