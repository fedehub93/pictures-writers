# FAQ as a generic resource for products and posts

Status: ready-for-agent

## Problem Statement

Le FAQ sono oggi gestite soltanto per i prodotti via modello dedicato `ProductFAQ` (`question`, `answer`, `sort`, `productId`), gestite inline nel form prodotto e renderizzate sulla pagina prodotto come accordion (`FaqSection`) più JSON-LD (`FaqPageJsonLd`).

Il blog richiede la stessa capacità per i Post, principalmente per SEO: le FAQ sul post rendono l'articolo idoneo a essere citato come fonte dagli AI Overviews e dai motori AI (Google ha rimosso i FAQ rich results nel maggio 2026, ma lo schema `FAQPage` resta valido e viene parsato da Google AI Overviews, Bing, Perplexity e altri). Il valore SEO residuo è la struttura domanda/risposta autonoma e ben delimitata, non un rich snippet.

## Solution

Generalizzare le FAQ a un unico modello Prisma `Faq` con foreign key opzionali a `Product?` e `Post?`, esattamente una delle due impostata (enforcement applicativo). Il contenuto è per-entità (non condiviso, niente libreria riusabile). L'attach (quali FAQ e in che ordine) fa parte della versione della risorsa: a ogni nuova versione del prodotto/post le righe vengono eliminate e ricreate contro l'ID della versione, come oggi con `ProductFAQ`.

Per i prodotti: il form inline e il flusso esistente vengono generalizzati da `ProductFAQ` a `Faq`. Per i post: nuova sezione nella sidebar del form post, aperta da un pulsante dropdown che apre una modal `ResponsiveDialog`, con il form FAQ (pattern minimale, in linea con la direzione di semplificazione della pagina post).

Rendering pubblico dei post: `FaqSection` subito dopo il body, prima di `PostBottom`, più `FaqPageJsonLd` sulla pagina published.

## User Stories

1. As an editor, I can add, edit, reorder, and remove FAQ entries on a product, so that product pages keep their existing FAQ section and structured data.

2. As an editor, I can add, edit, reorder, and remove FAQ entries on a post from a modal dialog opened from the post sidebar, so that the post page shows an FAQ accordion after the body.

3. As an editor, I save FAQ changes for a draft/scheduled post on the existing editable version, so that the latest saved list is used.

4. As an editor, I save FAQ changes to a post that has a CHANGED version, so that they apply to the CHANGED version without touching the published version.

5. As an editor, I publish a post with FAQ entries, so that the published page renders the accordion and the FAQPage JSON-LD.

6. As a visitor, I can read the FAQ accordion on a published post (expandable questions), placed after the article body.

7. As a visitor, I see no FAQ section on a published post without FAQ entries.

## Implementation Decisions

- Replace the `ProductFAQ` model with a single `Faq` model: `id`, `question`, `answer`, `sort`, optional `productId` and `postId` (both related with `onDelete: Cascade`), timestamps, and indexes on both FKs. Product and Post both expose `faqs Faq[]`.

- Exactly one FK must be set per row; Prisma cannot express a partial unique constraint, so the invariant is enforced at the application write layer.

- The migration copies existing `ProductFAQ` rows verbatim into `Faq` (with `productId` set, `postId` null), creates the `Faq` table, and drops `ProductFAQ`. Existing product data must be preserved and products must behave unchanged.

- Product write path (draft PATCH in `versions/[productId]/route.ts` and `createNewVersionProduct` in `src/lib/product.ts`) switches from `db.productFAQ` to `db.faq` with the same delete-then-create semantics against the current version's product id.

- Product admin form (`product-form.tsx`, `product-faq-form.tsx`) keeps its inline accordion; only the involved data references (`initialData.faqs`, Prisma field name) change from `ProductFAQ` to `Faq`.

- Product public data layer (`getPublishedProductBySlug`, `getDraftProductBySlug`) keeps selecting `faqs { question, answer }` ordered by `sort asc` from the new table. Public product rendering (`FaqSection`, `FaqPageJsonLd`, webinar/service/service-summary/submission) is unaffected.

- Post write path adds `faqs` to `postUpdateSchema` (array of `{ id?, question, answer, sort }`). In `createNewVersion`:
  - Branch A (published -> new CHANGED version): after creating the new post row, delete-and-create `Faq` rows against the new version's id.
  - Branch B (draft/scheduled -> existing version): delete-and-create `Faq` rows against the existing post id.

- Admin post queries seed the editor with the current version's FAQ list: add `faqs { id, question, answer, sort }` to the `getLastByRootId` selection.

- Post sidebar: a `DropdownMenu` trigger with a single item "FAQ" opens a `ResponsiveDialog` (mobile drawer / desktop dialog) containing the FAQ editor. The editor reuses a generalized version of `ProductFAQForm` (drag-reorder + inline question/answer accordion), declared against the post update input.

- Post public rendering: `getPublishedPostBySlug` and `getDraftPostBySlug` select `faqs { question, answer }` ordered by `sort asc`. `PostTemplate` renders `<FaqSection faqs={...} />` inside the article after the body (after `TipTapRendererV2`, before `PostBottom`). `post-slug-view.tsx` renders `<FaqPageJsonLd mainEntity={post.faqs} />` alongside `BlogPostingJsonLd`.

- Where a post has no FAQ entries, both the section and the JSON-LD render nothing (existing behavior of both components).

- Terms: the Prisma model is **Faq**; `FaqSection` and `FaqPageJsonLd` keep their names and are the canonical public vocabulary (see CONTEXT.md). The former `ProductFAQ` name is retired.

## Testing Decisions

- No automated test suite exists in this repository. Verification is via `npm run lint`, TypeScript/build via `npm run build`, and manual verification of the admin flows (product save, product publish, post save, post publish) against a local database.

- The migration must be verified against a copy of production-like data: `ProductFAQ` rows are preserved with identical `question`/`answer`/`sort` and correct `productId`.

- Verify public product pages still render the FAQ section and JSON-LD after the migration (webinar and service layouts, including the submission service-summary accordion).

- Verify draft product pages still receive `faqs`.

- Verify post draft view edits FAQ via the modal and that the edited list appears in the accordion on the published post.

## Out of Scope

- A shared/reusable FAQ library across entities (explicitly rejected; content is per-entity).

- FAQ on Page, Category, Tag, or other entity types. The model can be extended later with an additional optional FK.

- New SEO strategy beyond reusing the existing `FaqPageJsonLd` component.

- Changes to the public `FaqSection` styling or heading copy (hardcoded Italian heading stays).

- AI-enriched FAQ generation or FAQ suggestion.

## Further Notes

- ADR `docs/adr/0002-faq-generic-model.md` records the data model decision and the rejected alternatives.
- CONTEXT.md defines Faq, FaqSection, FaqPageJsonLd.
- Google FAQ rich results were removed for all sites on May 7 2026; `FAQPage` schema remains valid and is consumed by AI answer engines, so it is retained.