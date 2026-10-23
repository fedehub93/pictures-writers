# 05: Render form builder fields in the download modal

**What to build:** The public download modal renders its fields dynamically from the linked form's builder content instead of using a hardcoded email + privacy layout.

**Blocked by:** None (future refactor).

**Status:** done

- [x] Replace the hardcoded `FreeDigitalDownloadModal` fields with `FormRunner` rendered inside the modal.
- [x] Ensure the submit handler still calls `subscribeFreeDigitalProduct` with the values collected by the form runner.
- [x] Support the same minimum set of fields needed for lead magnets (email, privacy checkbox) without breaking richer forms.
- [x] Verify that validations and GTM events still work when the form is rendered dynamically.

## Notes

Implemented in this ticket.

- `FreeDigitalDownloadModal` now renders `FormRunner` with the linked form's `content`; the product query loads the form relation for the public product page.
- Legacy forms without builder content (or with empty content) fall back to `DEFAULT_FREE_DIGITAL_DOWNLOAD_FORM_CONTENT` (email + privacy checkbox + submit button), so the existing ebook keeps working without a data migration.
- Missing email/consent fields are appended to authored content, so every lead-magnet form keeps the minimum contract while richer forms are used untouched.
- The modal renders its own footer inside the form: reCAPTCHA notice, then `Chiudi` and `Scarica gratis` on one row with equal width. Authored submit buttons are stripped so there is a single submit action.
- The submit handler maps the runner values through `extractFreeDigitalDownloadFields` (detecting the email field by input type and the consent checkbox by name/label), then calls `submitDigitalDownload` → `subscribeFreeDigitalProduct`.
- The action now uses a loose Valibot object and stores any extra answers in `FormSubmission.data` and the `form.submitted` payload, so richer forms are not silently discarded.
- The generic `digital_download` GTM event still fires only on success. `FormRunner` also fires the linked form's own event when configured; it no longer sends an event with a null name.
- Required checkbox fields now fail client-side validation with a field message, matching the server's privacy-consent check.
- The form builder's submit button is disabled while submitting, so a double click cannot create a duplicate download/submission.
- Verified with `npx tsc --noEmit`, targeted Vitest files, ESLint on touched files, and the full suite (158 files, 1311 tests).
