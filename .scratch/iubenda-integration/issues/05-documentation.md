# 05: Documentation and decisions

**What to build:** The reasoning behind a consent provider living in Integrations, the new failure semantics of public reads, and the script-order contract are recorded where future maintainers will find them. The glossary and the affected ADR stop describing the old model.

**Blocked by:** 03 (Consent Mode and script order), 04 (Cutover and custom-scripts cleanup)

**Status:** ready-for-agent

- [ ] A new ADR records that Integration admits providers without secrets, that public configuration reads fail open while credential reads stay fail-loud, that the CMP owns Consent Mode, and that script order is contractual; rejected options are listed.
- [ ] ADR 0028 is amended: its third-party-scripts section no longer claims Iubenda and the script model are untouched.
- [ ] The glossary defines `Integration` with optional secrets and lists consent management among the examples of `Provider`.
- [ ] The operator cutover order (remove old entries, deploy disabled, configure, enable in preview, then production) is documented in the integrations runbook.
- [ ] No documentation references an API key or connection test for Iubenda.
