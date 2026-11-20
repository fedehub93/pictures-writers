# 15: [human] Run the migration on the existing Installation

**What to build:** The existing Installation ends with every file on local disk, every address canonical, and no dependency on the provider — without a visitor seeing a broken picture. The sweep runs first, then the re-home, then the purge after the grace window, with a green audit between steps.

**Blocked by:** 11, 12, 14

**Status:** ready-for-human

- [ ] The sweep reports zero residuals and every existing Media answers on its canonical address.
- [ ] The re-home moves all 720 plus every attachment and avatar, and no key, revision or address changed.
- [ ] The audit is green before and after each step.
- [ ] After the grace window the purge removes exactly the recorded objects, and the provider resolves none of them.
- [ ] The provider token is removed from the environment and the library, the site, the forms and the email attachments still work.
- [ ] The documentation no longer describes the mixed library as an end state, and the ADR records the transition instead.
