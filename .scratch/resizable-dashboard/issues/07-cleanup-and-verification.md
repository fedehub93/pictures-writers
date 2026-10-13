# 07: Cleanup and verification

**What to build:** The old one-dimensional grid model is fully removed and the feature is verified end to end: no dead code or unused utilities remain, the touched tests are updated, and the pipeline is green.

**Blocked by:** 03, 04, 05, 06

**Status:** ready-for-agent

- [ ] The row-packing helper and its test are deleted, along with the fixed column-span utilities and helpers the new model replaced.
- [ ] The size menu is gone, replaced by the keyboard layout control, and no import references the old grid utilities.
- [ ] No dead code remains from the discrete-size model or the legacy hidden branch.
- [ ] The dashboard module's tests (pure helpers, layout filter, procedures, registry) reflect the positioned model and pass.
- [ ] `npm run lint`, `tsc --noEmit`, `npm run test:run`, and `npm run build` are all green.
- [ ] Manual acceptance confirms drag, resize, compaction, edit-mode entry/exit, add/remove, single-column collapse, touch behaviour, and the keyboard layout control.
