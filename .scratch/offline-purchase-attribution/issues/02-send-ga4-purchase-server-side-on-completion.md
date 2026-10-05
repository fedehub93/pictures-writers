# 02: Send the GA4 purchase server-side on order completion

**What to build:** When an authorized backoffice user completes an Order, the server resolves the Customer's Contact identity and sends a GA4 `purchase` event through the Measurement Protocol, attributed to the Customer's original `client_id`. An Order with no stored identity sends nothing. The client-side purchase push from the admin is removed.

**Blocked by:** 01 — Capture the visitor's GA client_id at form submission.

**Status:** parked — see `.scratch/offline-purchase-attribution/spec.md` for why and the revival threshold.

- [ ] Completing a pending Order whose Customer has a stored `ga_client_id` sends exactly one Measurement Protocol `purchase` request carrying that `client_id` and the ecommerce payload (`transaction_id`, `value`, `currency`, `items`).
- [ ] Completing an Order whose Customer has no stored identity sends no request.
- [ ] A failed or slow send never fails or rolls back the Order completion.
- [ ] A second completion attempt does not send a second request (the `PENDING → COMPLETED` guard, plus GA4 dedupe by `transaction_id`).
- [ ] The send is skipped when the GA4 measurement id or the Measurement Protocol API secret environment variable is absent.
- [ ] The client-side `sendGTMEvent` purchase call and its import are removed from the admin order actions.
- [ ] The existing pure payload projection is reused rather than duplicated.
- [ ] Unit test for the Measurement Protocol payload mapping and integration tests with the HTTP client mocked (event sent, no-op without identity, failure tolerated) pass.
