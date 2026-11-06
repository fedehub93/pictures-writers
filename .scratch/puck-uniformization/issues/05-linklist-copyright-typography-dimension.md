# 05: Migrate LinkList and Copyright to shared typography and dimension

**What to build:** LinkList and Copyright gain the shared typography and dimension fields and apply the shared style variables and classes. Their current appearance is preserved through defaults: the Copyright line keeps the small footer type size and the LinkList title keeps its semibold treatment. Link resolution, empty-row handling, the Copyright server renderer that reads the site name and year from Installation settings, and the database-free editor canvas are unchanged.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] LinkList and Copyright expose typography and dimension and apply the shared variables and classes.
- [ ] The Copyright block defaults to the current small footer type size; the LinkList title remains semibold.
- [ ] Resolved links, unresolved entity links, legacy resolved links, external new-tab links and empty rows behave exactly as before.
- [ ] The Copyright public renderer still reads the site name from Installation settings, and the editor canvas stays database-free.
- [ ] Tests assert the new style variables alongside the existing behavioural assertions.
- [ ] Type check, lint and the test suite pass.
