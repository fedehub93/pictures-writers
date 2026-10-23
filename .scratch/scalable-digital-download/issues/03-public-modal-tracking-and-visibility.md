# 03: Public modal, tracking and visibility

**What to build:** A visitor can download any free `EBOOK` product from the public UI; marketing sees the event in analytics and dashboard, and the right automation starts.

**Blocked by:** 02 — Backend download flow.

**Status:** done

- [x] Create a generic `FreeDigitalDownloadModal` with email field and privacy checkbox.
- [x] Integrate the modal into the public product detail page for `EBOOK` products with `acquisitionMode = FORM`.
- [x] Fire the `digital_download` GTM event with parameters `product_id`, `product_slug`, `product_name`, `form_id`, and `source`.
- [x] Confirm the existing "Form submissions" metric and its form filter show the download submissions: selecting all lead-magnet forms gives the total, selecting one form gives that product's downloads. No new metric is introduced.
- [x] Verify that an automation with a `form.submitted` trigger scoped to the product's linked form starts when the modal is submitted.
- [x] Keep the legacy ebook modal as a fallback until ticket 04.

## Notes

- `FreeDigitalDownloadModal` uses shadcn `Dialog`, `Field`/`FieldGroup`, `Checkbox`, `Input` and `Alert`; it validates email + privacy consent with the existing `FreeDigitalDownloadSchemaValibot` and reuses the `subscribe_product` reCAPTCHA action.
- `EbookInfo` mounts a download modal only for `acquisitionMode = FORM`. A linked `formId` selects the generic modal; a missing form keeps `FreeEbookModal` as the compatibility fallback. Non-FORM products mount no download modal.
- GTM wiring lives in `digital-download-event.ts` (payload shape) and `digital-download-submission.ts` (fires only when the action reports success), so the event contract is unit-tested without a DOM.
- No metric code changed. Tests confirm downloads create `FormSubmission` rows under the linked form and that `dashboard.getMetricSeries` returns the aggregate for all lead-magnet forms and the single-product count for one form.
- The scoped automation assertion now also checks `triggerType`, and a new case proves an automation scoped to a different form does not start.
- Verified with `npx tsc --noEmit`, targeted Vitest files, the full suite (155 files, 1297 tests), and ESLint on touched files.
