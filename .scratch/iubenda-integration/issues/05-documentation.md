# 05: Documentation and decisions

**What to build:** The reasoning behind a consent provider living in Integrations, the new failure semantics of public reads, and the script-order contract are recorded where future maintainers will find them. The glossary and the affected ADR stop describing the old model.

**Blocked by:** 03 (Consent Mode and script order), 04 (Cutover and custom-scripts cleanup)

**Status:** done

- [x] A new ADR records that Integration admits providers without secrets, that public configuration reads fail open while credential reads stay fail-loud, that the CMP owns Consent Mode through the Iubenda GTM template, and that script order is contractual; rejected options are listed.
- [x] ADR 0028 is amended: its third-party-scripts section no longer claims Iubenda and the script model are untouched.
- [x] The glossary defines `Integration` with optional secrets and lists consent management among the examples of `Provider`.
- [x] The operator cutover order (remove old entries, deploy disabled, configure, enable in preview, then production) is documented in the integrations runbook.
- [x] No documentation references an API key or connection test for Iubenda.

## Notes

The decision is recorded in `docs/adr/0031-consent-provider-in-integrations.md`. ADR 0028's third-party-scripts section now describes Iubenda as an Integration rendered from the root layout ahead of GTM, with `AppScripts` carrying no provider-specific rules. `CONTEXT.md` defines `Integration` with optional secrets and lists consent management under `Provider`. The cutover steps were added to `docs/integrations-runbook.md`, including that Iubenda needs no secrets. Documentation-only change; no tests to add or update.
