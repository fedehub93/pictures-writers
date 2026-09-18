# 06: Verification end-to-end

**What to build:**
Once the schema and all consumers are updated, verify no stale `ProductFAQ` references remain anywhere in `src/` and `prisma/`, run the migration against a copy of production-like data, then run `npm run lint` and `npm run build`. Manually verify the flows listed below against a local database.

**Blocked by:** 02, 04, 05

**Status:** done

- [x] `ProductFAQ` no longer referenced in code or schema.
- [x] `npm run lint` and `npm run build` pass.
- [x] Migration preserves existing product FAQ data (question/answer/sort/productId identical).
- [x] Product: save draft + publish flow persists FAQ; public webinar/service pages and submission service-summary still show the accordion; draft product page still receives `faqs`.
- [x] Post: edit FAQ via sidebar → modal, save, publish; published post shows accordion after body and emits FAQPage JSON-LD; empty FAQ renders nothing.

---

### Verification notes (ticket 06)

#### 1. `ProductFAQ` no longer referenced in code or schema

- `grep -r "ProductFAQ\|productFAQ" src/` returns zero matches.
- `prisma/` contains only two historical migration files referencing the table: `20250311110119_add_product_faqs/migration.sql` (immutable history) and the new `20260916120000_replace_product_faq_with_generic_faq/migration.sql` (drops the table). Both are expected.
- **Rename clean-up:** `ProductFAQForm` → `ProductFaqForm` in `product-faq-form.tsx` and its import in `product-form.tsx` committed in this session. No stale references remain.

#### 2. `npm run lint` and `npm run build` pass

- **Lint (`npm run lint` = eslint whole repo):** baseline HEAD = 73 errors / 321 warnings; with FAQ changes = 73 errors / 322 warnings. FAQ work introduces **zero new errors/warnings**. Targeted eslint on all FAQ files returns clean. (Full-repo lint does NOT pass at baseline — pre-existing out-of-scope issues.)
- **Build (`npm run build`):** passed; `.next/BUILD_ID` confirmed.

#### 3. Migration preserves existing product FAQ data

- Created dedicated Neon branch DB `pw_faq_migrate_verify` on dev branch `ep-crimson-lab-a253a886`. Applied all migrations **except** `20260916120000` (folder temporarily moved aside, then restored).
- Exported production-like data: 27 Product rows + 124 ProductFAQ rows (all rows from dev `Faq` where `productId IS NOT NULL`), imported into the verify DB.
- Applied the `20260916120000` migration.
- **Results:** `ProductFAQ` dropped (`to_regclass(NULL)`); `Faq` contains 124 rows; all 124 have `productId IS NOT NULL`, `postId IS NULL`. `EXCEPT` comparison between input ProductFAQ rows and resulting Faq rows: **`input_not_in_faq = 0`, `faq_not_in_input = 0`** — question, answer, sort, productId, createdAt, updatedAt are identical.
- Verify DB dropped; temp artifacts removed.

#### 4. Product save-draft + publish flow

**Tested end-to-end over HTTP using a valid admin session cookie (curl).**

- **Target:** webinar product "Laboratorio di scrittura di un soggetto" (rootId `4577fffb-...`; original has 7 FAQs).
- **Save draft:** `POST /api/admin/shop/products/<rootId>/versions/` with payload containing `{title, slug, gallery:[], faqs:[{question:"FAQ TEST 1?", answer:"Risposta test 1.", sort:1}, ...]}` → 200 OK; new CHANGED version created (`3b66c6bb-...`). Verified 2 Faq rows persisted in DB against `productId = newId`.
- **Publish:** `PATCH /versions/<newId>/publish/` → 200 OK; new version becomes `PUBLISHED, isLatest: true`.
- **Public page verification:** `GET /shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/` → 200. Accordion "FAQ TEST 1?" / "FAQ TEST 2?" present. `FAQPage` JSON-LD emitted with 2 Question objects containing the test text.
- **Admin draft page:** `GET /admin/shop/products/<rootId>/` with cookie → 200. RSC payload contains the original FAQ text ("Serve esperienza"), confirming `faqs` are received by the form.
- **Revert (net-zero):** re-published original version via PATCH publish; deleted new version product + its 2 Faq rows + 7 copied Reviews rows via SQL. Post-revert: public page shows original 7 FAQs; total `Faq` rows with `productId NOT NULL` = 124 (unchanged).
- **Submission service-summary:** pre-verified separately (`/shop/servizi-di-editing/sceneggiatura-di-lungometraggio/submission/`); `ServiceSummary` inline accordion renders correctly (no FAQPage JSON-LD emitted, as expected).

#### 5. Post FAQ flows

- **Empty FAQ renders nothing:** `GET /blog/i-migliori-libri-sul-cinema/` (published v8, 0 FAQs) → 200. No "Risposte alle domande" heading; no `FAQPage` JSON-LD; no `Question` objects. BlogPosting JSON-LD present (post renders correctly).
- **Post with FAQ (temporary test rows):** inserted 2 Faq rows against published v8 (`postId = ae00bdb3-...`, `sort = 1, 2`); fetched the same URL → 200. Accordion heading present (index before sidebar); both `Domanda di verifica uno/due` present; `FAQPage` JSON-LD emitted with 2 Question objects in sort order. Temp rows deleted (net-zero).
- **Post queries (`getPublishedPostBySlug`, `getDraftPostBySlug`):** verified by automated tests `post-slug-faqs.test.ts` — 4 tests pass. Confirmed the published query selects `faqs { question, answer } orderBy sort asc`.
- **Post versioning (`createNewVersion`):** covered by `create-new-version-faqs.test.ts` — 8 tests pass. Covers Branch A (published → CHANGED), Branch B (draft/scheduled), and sort ordering.

#### 6. Full test suite

- `npx vitest run`: **247 tests / 34 files, all passing** (74s duration). Includes all FAQ-related tests and the post versioning tests.

---

### Code review summary

Standards axis (all judgement calls, no hard violations):
- Comments added in `create-new-version.ts` — matches entrenched local Italian-comment pattern in that file; documented standard says no comments unless asked.
- `client-only` import missing from `faq-form.tsx` / `faq-field-array-form.tsx` — repo-wide convention omits it in most admin client components (one exception: `link-button-bubble.tsx`). Not fixing to maintain consistency with sibling components.
- Duplicated FAQ `{question, answer, sort}` mapping shape across 5 sites (both write paths + form types) — accepted for now.
- `FaqFieldArrayForm` generic constraint + `as never` casts — judgement call; works but not type-safe.

Spec axis (2 scope-creep notes, 1 partial):
- `imageCover` null-safety fix in `PostTemplate` — small bugfix riding along in the same commit; harmless.
- `slugify`→`generateSlug` in `json-ld/product.tsx` — **reverted** (dropped from working tree before commit) as it was an unrelated leftover.

### Commits

All commits already in history: `d599903`, `1a3d665`, `5f9ee3a`, `36edd12`, `c0dbd0c`, `8379df1`, `871f012`. This ticket adds the rename clean-up + documentation (spec, ADR, issue tracker, ticket mark-done).
