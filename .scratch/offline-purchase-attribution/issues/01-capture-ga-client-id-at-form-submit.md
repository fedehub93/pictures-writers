# 01: Capture the visitor's GA client_id at form submission

**What to build:** When a visitor submits a public Form, capture their GA4 `client_id` from the `_ga` cookie and store it on their Contact as generic `metadata`, so the identity is available later when an offline Order is completed. If no `_ga` cookie exists, nothing is stored.

**Blocked by:** None (can start immediately).

**Status:** parked — see `.scratch/offline-purchase-attribution/spec.md` for why and the revival threshold. Was implemented in `eb7b68a`, then removed when the feature was parked.

- [ ] A pure helper extracts the GA4 `client_id` from a `_ga` cookie value, handling the absent case and the domain-depth variants (`GA1.1.*`, `GA1.2.*`).
- [ ] Submitting a public Form while a `_ga` cookie is present stores `{ "ga_client_id": "…" }` in the Contact's `metadata`.
- [ ] Submitting with no `_ga` cookie stores no identity (no empty string, no null placeholder).
- [ ] Submitting twice from the same email updates the stored identity without creating a second Contact.
- [ ] Existing Contact fields and flows are unaffected, and the `form → customer → order` Automation graph and its payload are not changed or re-published.
- [ ] The Contact `metadata` field is typed via the repo's JSON type generator.
- [ ] Unit test for the parser and an integration test (real test DB) for submission persistence pass.
