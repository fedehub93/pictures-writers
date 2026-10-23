# Spec: Scalable free digital download

**Status:** ready-for-agent  
**Feature slug:** `scalable-digital-download`

---

## Problem Statement

Today the free ebook download is a special-case flow hardcoded around a single asset. The modal, server action, contact interaction, admin notification, dashboard metric, GTM event, email template setting, and built-in form all assume there is only one ebook.

Because a new lead magnet (a workbook) must be added to the marketing funnel, the system needs to support any number of free digital products — specifically `EBOOK` products acquired via `FORM` mode — without duplicating code or special-casing each asset.

## Solution

Generalize the free digital download flow so that any `EBOOK` product with `acquisitionMode = FORM` can be downloaded by entering an email in a public modal. The product is linked to a reusable `Form` record that provides:

- the `interactionType` written on the `Contact`;
- the `formId` used by `form.submitted` automations;
- the `FormSubmission` row that records the download.

A single global email template delivers the file link. A generic modal handles email + privacy checkbox. A new server action orchestrates validation, contact creation, submission, automation event, email send, and admin notification.

The existing ebook keeps working via an automatic migration to the new model, with a temporary compatibility fallback.

The public modal renders the linked form through the form builder's visual field renderer (`FormRunner`), so richer lead-magnet forms work without code changes. Forms without builder content fall back to a built-in email + privacy layout.

## User Stories

1. As a marketer, I want to create a new free `EBOOK` product in the CMS and link it to a `Form`, so that visitors can download it without asking a developer.
2. As a marketer, I want each free product to have its own `Form`, so that I can trigger a different automation sequence for each lead magnet.
3. As a marketer, I want the `Form` to declare which `interactionType` is written on the `Contact`, so that I can segment contacts by the exact asset they downloaded.
4. As a visitor, when I open a free product page and click the download CTA, I want to see a modal asking for the fields configured for that lead magnet (at minimum my email and privacy consent), so that I can get the file quickly.
5. As a visitor, after submitting the modal, I want to receive an email with a link to download the PDF, so that I can access the asset.
6. As a marketer, I want the download event to be tracked in analytics with a generic event name and product parameters, so that I can aggregate all free downloads and drill down by product.
7. As an admin, I want to use the existing "Form submissions" metric with a form filter, so that I can see total free downloads and drill down per product.
8. As an admin, I want download submissions to appear under the linked `Form`, so that I can review them alongside other form submissions.
9. As a marketer, I want the existing ebook to keep working after the change, so that I do not lose the live funnel while migrating.
10. As a developer, I want the old ebook-specific modal, server action, and built-in form to be removable after migration, so that the codebase does not carry dead code.
11. As a marketer, I want to choose one global email template for all free digital downloads, so that the delivery experience is consistent.
12. As an admin, I want to select the linked `Form` from the product edit page, so that the connection between product and automation is visible and editable.

## Implementation Decisions

- **Product type stays `EBOOK`**. The workbook is a PDF, so it is modelled as an `EBOOK` product. No new `ProductType` is introduced in this spec.
- **Acquisition mode stays `FORM`**. The `FORM` mode already means "acquire by submitting a form"; we reuse it rather than inventing a new enum value.
- **One `Form` per product**. `ProductVersion.formId` links the product to the form. The form provides the interaction type and automation trigger identity.
- **New `interactionType` field on `Form`**. The admin sets the interaction type on the form (e.g. `ebook_downloaded`, `workbook_downloaded`). The download action reads it and writes the corresponding `EmailContactInteraction`. This lets the same contact download multiple different assets.
- **New global email template setting**. A single setting (e.g. `freeDigitalDownloadTemplateId`) replaces `freeEbookTemplateId` for all free digital downloads. The template receives product variables (title, download URL, cover image, etc.).
- **Form-driven public modal**. The modal shows product title/subtitle and renders the linked form with `FormRunner`. Legacy forms with no builder content fall back to a built-in email field, privacy checkbox, and submit button.
- **New server action**. `subscribeFreeDigitalProduct` receives `rootId`, `email`, and consent; it loads the live product, the linked form, creates/updates the `Contact` with the form's interaction type, creates a `FormSubmission`, emits `form.submitted`, sends the email, and creates an admin notification.
- **Generic GTM event**. The event is named `digital_download` and carries parameters `product_id`, `product_slug`, `product_name`, `form_id`, and `source`.
- **Generic admin notification**. A new notification type `DIGITAL_DOWNLOAD` replaces the ebook-specific one.
- **Dashboard visibility reuses Form submissions**. No new metric is added: each download creates a `FormSubmission`, and the existing `submissions` metric already supports a form filter. Selecting the lead-magnet forms gives the aggregate; selecting one gives that product's downloads. There is no backfill: the metric starts counting at deploy, so the legacy `ebooks` metric stays as the historical (and unique-contact) view.
- **Automatic migration for the existing ebook**. A migration creates a shadow `Form` for the existing ebook, sets its `interactionType` to `ebook_downloaded`, and links it to the existing ebook product. Old code remains as a temporary fallback.
- **Cleanup in a final ticket**. Once the new flow is verified, remove `FreeEbookModal`, `subscribeFreeEbook`, `BUILT_IN_EBOOK_FORM_ID`, the old notification type, the old metric, and the old email template setting.

## Testing Decisions

- Tests should exercise external behaviour, not implementation details: a product exists, a visitor submits the modal, and the expected side effects happen.
- The highest-value seam is the server action: given a live `EBOOK` product linked to a form, calling the action must create the contact, submission, automation event, and email send.
- UI tests for the modal should verify that it opens from the product page, submits to the action, and fires the GTM event.
- Migration tests should verify that the existing ebook product ends up linked to a form with the correct interaction type.
- Automation integration tests should verify that submitting the modal triggers an automation scoped to that form.
- Prior art: existing tests for `subscribeFreeEbook`, form submissions, product forms, and automation `form.submitted` triggers.

## Out of Scope

- Customer area / private library where users can re-download files.
- Paid digital downloads with checkout (those continue through the existing order flow).
- New `ProductType` values such as `WORKBOOK` or `DIGITAL_DOWNLOAD`.
- Per-product email template override.
- Webhook or third-party provider behaviour beyond what already exists.

## Further Notes

- The existing `BUILT_IN_EBOOK_FORM_ID` shadow form exists only so the automation trigger picker can list it. After migration it becomes unused and is removed in the cleanup ticket.
- The `EmailContactInteraction` table has a unique constraint on `[contactId, interactionType]`. Choosing distinct interaction types per form is what allows one contact to download multiple assets.
- The public download API (`/api/products/download`) already accepts any `EBOOK` format, so it can be reused without change.
- The thank-you/download page under `/shop/[categorySlug]/download` is already generic enough to be reused; only copy may need to be generalized.
