# 09: Remove the unused colour-option helper

**What to build:** Once Text and the Announcement bar no longer use the hand-rolled colour-option helper, remove that helper and its option type from the shared Puck constants. The theme and palette colour constants stay because the colour inputs in the editor still use them.

**Blocked by:** 04, 07.

**Status:** done

- [x] No Puck block imports the colour-option helper.
- [x] The helper and its option type are removed from the shared Puck constants.
- [x] The theme and palette colour constants remain because the colour inputs still use them.
- [x] Type check and lint report no unused exports or imports.

## Implementation notes

- `src/puck/constants.ts` now exports only `THEME_COLORS` and `PALETTE_COLORS`; `buildColorOptions` and the `ColorOption` type are deleted.
- After tickets 04 and 07, nothing imported `buildColorOptions` or `ColorOption`: the only remaining consumers of the module are `src/puck/fields/rich-text/ui/components/color-picker-popover.tsx` and `src/puck/components/value-color-input/ui/index.tsx`, both of which import just the two colour arrays for the editor colour inputs.
- Verification: `npx tsc --noEmit` passes, targeted `npx eslint src/puck/constants.ts` is clean, and the full `npm run test:run` passes (221 files / 1830 tests). Repository-wide `npm run lint` still reports the same 40 pre-existing errors and 244 warnings in unrelated files noted in tickets 01/04/07; none are in the shared constants.
