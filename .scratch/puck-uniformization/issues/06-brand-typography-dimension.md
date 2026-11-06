# 06: Migrate Brand to shared typography and dimension

**What to build:** The Brand block gains the shared typography and dimension fields and applies the shared style variables and classes. The logo and site name continue to come from Installation settings with the existing overrides, the uppercase treatment stays a semantic class of the block, and the current site-name size, weight and letter spacing are preserved as defaults. The editor canvas remains database-free and the public path keeps its server renderer.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Brand exposes typography and dimension and applies the shared variables and classes.
- [ ] Site name and logo still come from Installation settings; the custom text and custom logo overrides are unchanged.
- [ ] Uppercase remains a semantic class because typography does not express text transform; default size, weight and letter spacing preserve the current look.
- [ ] The editor canvas stays database-free and the public path still reads settings through its server renderer.
- [ ] Tests cover the new style variables and the existing settings-driven rendering.
- [ ] Type check, lint and the test suite pass.
