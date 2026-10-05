# 03: Remove the admin Google Tag Manager container

**What to build:** The admin/backoffice layout no longer loads the Google Tag Manager container, so internal admin sessions stop reaching GA4. The public site's GTM/analytics behavior is unchanged.

**Blocked by:** 02 — Send the GA4 purchase server-side on order completion (the purchase event must be server-side first, otherwise removing admin GTM would drop the only source of the event).

**Status:** parked — see `.scratch/offline-purchase-attribution/spec.md` for why and the revival threshold. Note: the admin GTM container this ticket removes was already removed when the feature was parked, because it had only been added to make the client-side purchase work.

- [ ] The admin layout no longer renders the Google Tag Manager component.
- [ ] The public site's GTM container and analytics events are unchanged.
- [ ] No unused imports remain in the admin layout.
- [ ] With the admin GTM removed, completing an Order still produces the GA4 `purchase` event server-side (regression check tied to ticket 02).
