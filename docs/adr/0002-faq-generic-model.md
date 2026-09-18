# Generic Faq model instead of entity-specific FAQ tables or a shared library

**Status**: accepted

FAQ content was formerly stored per entity in `ProductFAQ` (question, answer, sort, productId), managed inline in the product form. The blog requires the same capability for SEO (structured FAQ answers, now consumed mainly by AI answer engines since Google removed FAQ rich results in May 2026). We generalize FAQ to a single Prisma `Faq` model with optional foreign keys to `Product?` and `Post?` (exactly one set, enforced application-side). Attachment semantics (which entities reference which Faq, in which sort order) are versioned with the entity: on each new product/post version, the appendix FAQ rows are deleted and recreated against the new version id, matching the existing ProductFAQ pattern.

Faq content is deliberately **not shared across entities** (unlike the rejected "shared library" option): each entity owns its own question/answer rows, keeping authoring inline and avoiding cross-entity edit side effects.

## Considered options

- **Shared FAQ library (FaqItem + N:M attach tables)**: enables reuse of the same answer across entities. Rejected: added data-management and UX complexity with no current use case.
- **Polymorphic table with `entityType`/`entityId` string columns**: adds entity types without migration but loses real FK constraints, Prisma cascade deletes, and type safety. Rejected; optional FKs give real constraints for the two current entities at the cost of a simple migration when a third entity type is added.
- **One table per entity (ProductFAQ + new PostFAQ)**: simplest, but duplicates schema and persistence code and does not read as "generic".

## Consequences

- Adding a third entity type (e.g. Puck Page, Category) requires a new optional FK column plus relation — a one-line migration, acceptable since admin UI is needed anyway.
- Editing a Faq answer updates it wherever that entity version is rendered; past versions have their own recreated rows, so historical versions are unaffected.
- Product page and post page share the `FaqSection` accordion component and `FaqPageJsonLd`.