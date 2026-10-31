# 01: GTM provider descriptor and admin form

**What to build:** Google Tag Manager appears on the Integrations page as a third provider with a single validated field, no credentials, and no connection test. Enabling it requires a valid container id, enforced in the form and server-side. No generic integration code changes; no database migration.

**Blocked by:** —

**Status:** done

- [x] `INTEGRATION_PROVIDER_GTM = "gtm"` is declared and listed in `INTEGRATION_PROVIDERS` (`src/modules/integrations/lib/constants.ts`).
- [x] `lib/providers/gtm-config.ts` exports a schema for `{ containerId }`: required, trimmed, uppercased, matching `^GTM-[A-Z0-9]{4,}$`, with an error message that shows the expected shape (`GTM-XXXXXXX`).
- [x] `lib/providers/gtm.ts` exports the descriptor: name "Google Tag Manager", a description naming the tag container, `configSchema`, `secretFields: []`, no `secretsSchema`, `affectsPublicSite: true`, `isReady` = the schema parses, `adminForm`.
- [x] `ui/components/providers/gtm-icon.tsx` wraps `TagIcon` from `lucide-react`, following `iubenda-icon.tsx`.
- [x] `ui/components/providers/gtm-form.tsx` follows `iubenda-form.tsx`: one text field with placeholder `GTM-XXXXXXX`, a description saying where the id lives in GTM, an inline error for a malformed id, and it submits `{ config: gtmConfigSchema.parse(values) }`. No credential fields, no remove-secret checkboxes, no test button.
- [x] The descriptor is registered in `INTEGRATION_DESCRIPTORS` (`lib/providers/index.ts`) and in `SERVER_DESCRIPTORS` (`server/descriptors.ts`) with no `connectionTest`.
- [x] `lib/types.ts` adds `gtm: Record<string, never>` to `IntegrationSecretsByProvider` and `gtm: GtmConfig` to `IntegrationPublicConfigByProvider`.
- [x] The new constant and type are reachable from `lib/index.ts`.
- [x] `lib/provider-guides.ts` has a `gtm` entry: where to find the container id, that GA4 and the other tags live inside the container, and that Consent Mode stays owned by the Iubenda template.
- [x] The provider card reads "Configured" / "Not configured", never mentions API keys, and shows no test action.
- [x] Tests: the config schema accepts a valid id (with surrounding whitespace and lowercase normalised) and rejects empty input, `GT-XXXX`, `ABC1234`, and a pasted snippet; the descriptor and setup-guide parity tests pass with three providers.
- [x] `npm run test:run` passes; ESLint on the changed module is clean. Repo-wide `npm run lint` still fails on 40 pre-existing errors in files this ticket does not touch.

## Notes

The descriptor is the whole provider. `Integration.provider` is a plain unique `String`, so no migration is needed: the row is created by the first save and `secretEncrypted` stores the encrypted empty object through the existing path, exactly as Iubenda does. `resolveIntegrationSecrets("gtm")` keeps throwing `no_secrets` and nothing calls it.

Validation is deliberately strict and does not parse snippets: a pasted GTM snippet contains more than one `GTM-` occurrence, and choosing one silently would move a typo from the form to production. GTM container ids have been `GTM-` followed by 4+ uppercase alphanumerics for the container's whole life, so the regex does not need to be permissive.

There is no connection test on purpose: the id is public, so an HTTP check against `googletagmanager.com` would only prove that Google answers. Real verification is Tag Assistant against the public site.

The setup guide is not optional: `lib/__tests__/provider-guides.test.ts` asserts that every provider has an entry.

## Comments

Implemented on `feature-gtm-integration` in commit `18fc0333`.

- Registration only: no change to the generic CRUD, schema, list projection or admin surface, and no Prisma migration (`Integration.provider` is a plain unique `String`).
- The `gtm` setup guide describes configuration only. Copy claiming the container is emitted after the consent block was dropped, because that behaviour belongs to ticket 02; the guide keeps the three required topics (where the id lives, that GA4 and the other tags live inside the container, that Consent Mode stays with the Iubenda template).
- The router tests gained GTM coverage (listing, normalise-and-enable, malformed id, enabling without an id, audit payload) and the provider-count assertions moved from two to three, as the spec requires. This is the only test change outside the schema/parity tests named above.
- `npm run test:run` passed with 197 files / 1646 tests. Repo-wide `npm run lint` was already failing before this change (40 errors in unrelated files); `npx eslint src/modules/integrations --max-warnings=0` is clean.
- Review (standards + spec, in parallel) found no missing requirement. The only actionable finding was the setup-guide copy, fixed before the commit.
