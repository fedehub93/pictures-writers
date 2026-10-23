# 01: Database and admin plumbing

**What to build:** The admin can configure a free `EBOOK` product by linking it to a `Form` and choosing the global delivery email template.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Add `interactionType` field to the `Form` model and update the form insert/update schema and admin form.
- [x] Add `freeDigitalDownloadTemplateId` field to `EmailSetting` and expose it in the email settings UI.
- [x] Migration: create a shadow `Form` for the existing ebook, set its `interactionType` to `ebook_downloaded`, and link it to the existing ebook product via `ProductVersion.formId`.
- [x] Add a form selector in the product edit page so an admin can choose the `Form` that drives a product with `acquisitionMode = FORM`.
- [x] Persist the selected `formId` when saving the product.
- [x] Existing data remains valid; the old ebook flow keeps working during the transition.

## Notes

Implemented in `f0792c71`.

- `Form.interactionType` is nullable; blank admin input is normalised to `null` in the forms router so legacy forms do not write an empty interaction.
- The migration creates a dedicated `free-ebook-download` Form (interaction `ebook_downloaded`) instead of reusing `BUILT_IN_EBOOK_FORM_ID`, so the link survives the ticket 04 cleanup. It links every unlinked `EBOOK` + `FORM` version and copies `freeEbookTemplateId` into `freeDigitalDownloadTemplateId` for the transition.
- The product form picker appears in the Pricing tab when `acquisitionMode = FORM`. `formId` persistence already existed in `saveProductVersion`; the test now covers the full admin-facing update.
- Verified with `npx tsc --noEmit` and the full Vitest suite (151 files, 1282 tests). ESLint on touched files has no errors.
