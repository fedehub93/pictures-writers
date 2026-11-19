# 11: The address sweep

**What to build:** A command rewrites every absolute provider address stored anywhere into the canonical address of the file it points to, in every field the product stores content in, and reports what it could not resolve. Running it twice changes nothing the second time.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Absolute addresses in page and post bodies, rich text, ad items, the logo setting, form submission data, email attachment urls and user images are rewritten to the canonical form.
- [ ] A second run reports zero changes.
- [ ] Unresolvable addresses are reported by field and by count, never by full address.
- [ ] The command reports how many files it touched, and the audit stays green afterwards.
- [ ] Rewriting changes no file's key, revision or driver.
- [ ] A dry run reports what would change without writing.
