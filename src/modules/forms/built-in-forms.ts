/**
 * Stable identities for submission entry points that are not yet modelled as
 * dynamic Forms.
 *
 * Some public surfaces (the home contact form, the newsletter widget) submit
 * hardcoded UIs. They cannot become dynamic Forms yet, but the
 * `form.submitted` trigger still needs an identity to scope to and to list in
 * its picker. These ids are that identity: they are stable across
 * environments, and the migration that seeds the shadow rows carries the same
 * literals. This module is the single source of truth for the application code;
 * keep it in sync with `prisma/migrations/20260928120000_seed_built_in_forms`.
 * The eBook id was removed in `20261023130000_remove_legacy_ebook_flow`, which
 * also deletes its shadow row.
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
