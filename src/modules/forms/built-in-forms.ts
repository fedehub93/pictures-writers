/**
 * Stable identities for submission entry points that are not yet modelled as
 * dynamic Forms.
 *
 * Some public surfaces (the home contact form, the newsletter widget, the
 * eBook download) submit hardcoded UIs. They cannot become dynamic Forms yet,
 * but the `form.submitted` trigger still needs an identity to scope to and to
 * list in its picker. These ids are that identity: they are stable across
 * environments, and the migration that seeds the shadow rows carries the same
 * literals. This module is the single source of truth for the application code;
 * keep it in sync with `prisma/migrations/20260928120000_seed_built_in_forms`.
 */

/**
 * The existing dynamic Form selected by the Puck `/contatti` page. It is
 * referenced by `Page.puckData` and by historical `FormSubmission` rows, so it
 * is reused as-is and must never be renamed.
 */
export const BUILT_IN_CONTACT_FORM_ID = "cad10953-192a-423f-9d75-852a2b26034f";

/**
 * Shadow Form for the newsletter widget. No page renders it; it exists only so
 * the `form.submitted` trigger picker can list and scope to it.
 */
export const BUILT_IN_NEWSLETTER_FORM_ID = "built-in-form-newsletter";

/**
 * Shadow Form for the eBook download flow (modal and product-pop widget). No
 * page renders it; it exists only so the trigger picker can list and scope to it.
 */
export const BUILT_IN_EBOOK_FORM_ID = "built-in-form-ebook";
