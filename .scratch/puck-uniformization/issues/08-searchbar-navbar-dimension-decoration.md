# 08: Add dimension and decoration to SearchBar and NavbarBlock, and editor icons

**What to build:** SearchBar and NavbarBlock gain the shared dimension and decoration fields so the backoffice editor can set margin, padding, background, border and radius on the header blocks without wrapping them in extra layout blocks. Neither block gains a typography field, because their internal type scale is part of the control design and a wrapper field would be partly ignored. The editor sidebar shows dedicated icons and human labels for Announcement bar, SearchBar and NavbarBlock instead of the generic square fallback.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] SearchBar and NavbarBlock expose dimension and decoration and apply the shared variables and classes.
- [ ] Neither block exposes a typography field.
- [ ] The existing search variants and the responsive desktop/mobile navigation projections are unchanged.
- [ ] The editor sidebar shows dedicated icons and human labels for Announcement bar, SearchBar and NavbarBlock; none falls back to the generic square.
- [ ] Region palettes and categories are unchanged apart from the added fields.
- [ ] Tests cover the new dimension and decoration variables and the existing behaviour.
- [ ] Type check, lint and the test suite pass.
