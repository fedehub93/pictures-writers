# 09: Remove the unused colour-option helper

**What to build:** Once Text and the Announcement bar no longer use the hand-rolled colour-option helper, remove that helper and its option type from the shared Puck constants. The theme and palette colour constants stay because the colour inputs in the editor still use them.

**Blocked by:** 04, 07.

**Status:** ready-for-agent

- [ ] No Puck block imports the colour-option helper.
- [ ] The helper and its option type are removed from the shared Puck constants.
- [ ] The theme and palette colour constants remain because the colour inputs still use them.
- [ ] Type check and lint report no unused exports or imports.
