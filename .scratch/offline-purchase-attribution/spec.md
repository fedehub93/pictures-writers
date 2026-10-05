# Offline Purchase Attribution

**Status:** parked (2026-10-05)

Parked deliberately, not abandoned. At the current volume (~2 orders / 2 months, ≈12/year) GA4 channel-level attribution is statistical noise: precise plumbing would feed a report that cannot drive a decision. The marketing plan (`.agents/marketing-plan.md`, decision #1) names offline attribution as the top operational gap, but the plan itself allows the cheaper alternative — a "paid" marker plus manual monthly reconciliation. The admin Order lifecycle already is that marker; what this feature added was only the GA4 attribution layer, at a cost that the volume does not yet justify (a permanent Measurement Protocol secret, a fragile Customer→EmailContact email bridge, GTM container surgery).

**Revival threshold:** reopen when measured orders exceed ~20/month, or when paid acquisition starts (attribution then decides where budget goes).

**Cheaper alternative to consider first:** a self-reported "how did you hear about us?" field at order completion. At low volume it beats pixel-based attribution per order, covers dark social, and costs a single field. The higher-leverage, independent work from the plan — the `course_purchased` / `editing_purchased` interactions and the product type in the form — unblocks the S3/S5 lifecycle sequences and does not need any of this machinery.

Superseded work: `8d4d4e5` (client-side GA4 purchase) and `eb7b68a` (client_id capture) were removed from the branch when this was parked. Both remain in git history if the feature is revived server-side.

## Problem Statement

Offline sales are closed by a backoffice user who manually completes an Order after the payment (email + bank transfer) arrives. Read `CONTEXT.md` for Customer, Order, Order completion, Contact and Form.

Today the GA4 `purchase` event is fired client-side from the admin's browser when the Order is completed. As a result:

- GA4 attributes the conversion to the admin's session, not to the Customer's original visit.
- The visitor's GA4 identity (`client_id`) is never captured anywhere, so there is no way to connect an offline payment to the content or channel that produced the lead.
- The event depends on the admin's browser, device, cookies and Consent Mode state — none of which represent the buyer.

The marketing plan (`.agents/marketing-plan.md`, decision #1) names this as the number-one operational gap: the top-funnel is tracked, but offline revenue is not attributable. The plan recommends a marker on the buyer plus a server-side GA4 event via the Measurement Protocol. This feature implements that method instead of the client-side shortcut.

## Solution

Capture the visitor's GA4 `client_id` at public form submission and persist it on their Contact as generic `metadata`. When an authorized backoffice user completes an Order, the server resolves the Customer's Contact by email, reads the stored `client_id`, and sends the GA4 `purchase` event server-side with the Measurement Protocol. The client-side purchase push from the admin is removed, and the admin Google Tag Manager container is removed so internal sessions stop reaching GA4.

Reading the `_ga` cookie is consent-aware by construction: once Consent Mode V2 is added with analytics storage denied, no `_ga` exists, so no `client_id` is captured and no purchase is sent. The design does not need to manage cookies inside the admin.

## User Stories

1. As a visitor, I want my form submission to record an anonymous analytics identity, so that my later offline purchase can be attributed without any extra action from me.
2. As a marketer, I want an offline Order completed in the backoffice to produce a GA4 `purchase` event credited to the Customer's original session, so that revenue is attributable to the content or channel that created the lead.
3. As a marketer, I want the purchase event sent server-side, so that it does not depend on the admin's browser, device, cookies or session.
4. As a marketer, I want the event to carry `transaction_id`, `value`, `currency` and ecommerce `items`, so that GA4 reports offline revenue and product performance consistently with online purchases.
5. As a marketer, I want the same payload projection used for the ecommerce mapping, so that the two never drift.
6. As a marketer, I want repeated completion attempts not to send a duplicate purchase, so that revenue is not double-counted.
7. As a marketer, I want Orders with no captured identity (for example manually created ones) to send no purchase event, so that GA4 is not polluted with unattributable conversions.
8. As an operator, I want a failure to send the analytics event never to fail or roll back the Order completion, so that a sale is never blocked by analytics.
9. As a privacy-conscious operator, I want the captured identity to amount to nothing when analytics consent is denied, so that Consent Mode V2 is respected automatically when it is introduced.
10. As an operator, I want the stored analytics identity to live in a generic container, so that a future change of analytics vendor or identifier scheme does not require a schema migration.
11. As an admin, I want my own backoffice sessions to stop reaching GA4, so that internal traffic does not distort reporting.
12. As a developer, I want the GA4 payload projection to remain a pure function, so that it can be tested without network or database.
13. As a developer, I want the server-side send isolated behind a single seam, so that it can be tested with a mocked HTTP client.
14. As a developer, I want the visitor identity captured at one point (form submission), so that no other entry point needs to change in v1.
15. As an automation author, I want capturing the identity not to require editing or re-publishing the existing form → customer → order Automation, so that existing flows keep working untouched.
16. As a developer, I want the server-side sender to be reusable for other GA4 events later, so that the same infrastructure serves post-purchase work.
17. As an operator, I want the Order's `orderDate` to stay the source of truth for historical reporting, independent of when GA4 receives the event.

## Implementation Decisions

- **Capture happens at public form submission.** A pure, client-side helper reads the `_ga` cookie and extracts the GA4 `client_id`. The form submission path passes it to the server submission action as an additional argument. If the cookie is absent, nothing is captured.
- **Persistence uses a generic, typed JSON container, not a vendor-fixed column.** The submission action writes the identity into a `metadata Json?` field on the Contact (the identified email address) as `{ "ga_client_id": "…" }`. This follows the repo's existing `metadata` convention (`OrderItem`, `Payment`) and is typed with `prisma-json-types-generator`. It is deliberately not a `gaClientId String?` column, so future identifiers (other vendors, `gclid`/`fbclid`, UTM, a first-party id) are added as keys without a migration.
- **Resolution is by email at completion.** Order completion resolves the identity from the Order's Customer email to the Contact. No link is added between Order and FormSubmission, and the Automation payload and the `CREATE_CUSTOMER` / `CREATE_ORDER` nodes are untouched, so the published Automation needs no change.
- **The send is server-side via the GA4 Measurement Protocol.** It reuses the existing pure payload projection (`buildGa4PurchaseEvent`) converted to Measurement Protocol shape: a `client_id` plus one `purchase` event carrying `transaction_id`, `value`, `currency` and `items`. Endpoint: the Google Analytics `/mp/collect` endpoint.
- **Configuration.** The GA4 measurement id reuses the existing `NEXT_GA_TRACKING_ID` environment variable (currently unused). A new environment variable holds the Measurement Protocol API secret. Both must be present, together with a known `client_id`, or the send is skipped.
- **Reliability mirrors the existing `order.completed` emit.** The send is best-effort: errors are logged and never propagate, so completion always succeeds. The single `PENDING → COMPLETED` transition is the dedupe boundary, so the app sends at most one event per Order; GA4 additionally deduplicates by `transaction_id`.
- **Client cleanup.** The client-side purchase push is removed from the admin order actions.
- **Internal traffic.** The Google Tag Manager container is removed from the admin layout. The public site's GTM/analytics behavior is unchanged.
- **Timestamp.** GA4 timestamps the event at receipt. `orderDate` is not used to backdate the event and remains the source of truth for historical reporting in the database.
- **Consent.** Full Consent Mode V2 is out of scope, but the capture-from-`_ga` approach is consent-aware by construction and gives the future consent layer a correct degradation path.

## Testing Decisions

- Tests assert external behavior (observable payloads and side effects), not private implementation details.
- **Pure tests** (no DB, no network): the `_ga` cookie → `client_id` parser (absent cookie; `GA1.1.*` and `GA1.2.*` domain-depth variants); the GA4 purchase projection (existing tests in `ga4-purchase.test.ts` are reused/extended).
- **Integration tests** against the test database: submitting a form with an identity persists it on the Contact; submitting without an identity stores nothing; duplicate submissions update rather than duplicate the Contact.
- **Integration tests** for completion with the HTTP client mocked: a stored identity yields one Measurement Protocol request with the expected URL and body; no stored identity yields no request; an HTTP failure does not fail completion; completing twice sends once.
- **Prior art**: `src/modules/orders/__tests__/ga4-purchase.test.ts` (pure projection), `src/modules/orders/__tests__/orders-router.test.ts` (router integration with the auth middleware mocked and a real test DB), and the existing form-submission tests.

## Out of Scope

- A full Consent Mode V2 implementation and a cookie banner.
- Capturing `gclid`, `fbclid`, UTM parameters, referrer or a first-party visitor id (the `metadata` container leaves room for them).
- Sending purchase events for entry points other than the order-bearing form.
- GA4 online checkout / Stripe (Stripe remains unused).
- Retry queue or persistence for failed Measurement Protocol sends.
- Migrating or reconciling legacy `Purchase` rows.
- Dashboard widgets for attributed revenue.

## Further Notes

- This closes the number-one operational gap in `.agents/marketing-plan.md` (attribution of paid offline conversions) using the method the plan recommended (a marker on the buyer plus a server-side GA4 event) rather than the client-side shortcut delivered earlier.
- The `metadata` name follows the repo's existing convention; the meaning lives in the typed JSON alias and its doc comment.
- Because the identity is resolved by email, a Customer whose email never passed through a form has no `client_id` and will not produce a purchase event. This is intentional: it avoids fabricating unattributable conversions.
- Once Consent Mode V2 lands, `_ga` will be absent when analytics storage is denied and the purchase will simply not be sent — no additional gating needed in the order code.
