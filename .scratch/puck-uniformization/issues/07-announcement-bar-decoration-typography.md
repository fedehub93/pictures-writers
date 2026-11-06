# 07: Migrate Announcement bar to shared decoration and typography

**What to build:** The Announcement bar gains the shared decoration, typography and dimension fields. Background, border, radius and opacity come from decoration; text colour, size, alignment and line height come from typography; spacing and sizing come from dimension. The two hand-rolled colour selects and their props are removed, and the default primary background with primary-foreground text is preserved. Dismissible behaviour, edit-mode visibility, smart-link rendering and the hide-on-empty-text rule are unchanged.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Background, border, radius and opacity come from decoration; text colour and type come from typography; spacing and sizing come from dimension.
- [ ] The `backgroundColor` and `textColor` props and their colour selects are removed.
- [ ] The default look remains the primary background with primary-foreground text and the current small centred type.
- [ ] Dismissible storage behaviour, edit-mode visibility, resolved and unresolved links, and the empty-text rule are unchanged.
- [ ] Tests assert the decoration and typography variables alongside the existing behavioural assertions.
- [ ] Type check, lint and the test suite pass.
