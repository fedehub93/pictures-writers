# 01: Schema, backfill, and cut-over for Post Root+Version

**What to build:** `Post` is split into `PostRoot` + `PostVersion`, every existing post/version is migrated (ids reused, links repointed, slug collisions resolved), and the legacy `Post` table is dropped — all in one one-shot migration.

**Blocked by:** None (can start immediately). This is the tracer bullet.

**Status:** done

## Acceptance criteria

- [x] `PostRoot` is `{ id, slug @unique, firstPublishedAt?, currentVersionId @unique, liveVersionId? @unique, createdAt, updatedAt }` with `versions` and the two pointer relations.
- [x] `PostVersion` is `{ id, rootId, version, status, title, description?, bodyData?, tiptapBodyData?, imageCoverId?, userId?, seoId?, publishedAt?, scheduledAt?, preSchedulingStatus?, createdAt, updatedAt }` plus `categories`, `tags`, `authors`, `faqs`, with `@@unique([rootId, version])` and `@@index([rootId])`.
- [x] The legacy `Post` model, its self-relation, `@@index([rootId])`, and the `isLatest`/`firstPublishedAt` duplication on revisions are gone.
- [x] `PostCategory`, `PostAuthor`, `Faq`, and the `_PostToTag` join reference `PostVersion.id`; `Faq.postId` is unchanged as a column name.
- [x] Inverse relations `User.postVersions`, `Seo.postVersions`, `Media.postVersions` replace `posts`/`post`.
- [x] The migration reuses each legacy `Post.id` as `PostVersion.id` and each `rootId` as `PostRoot.id`; `currentVersionId` = the current revision (highest `version`, superseding the ticket's original "= `isLatest`" wording — see Notes), `liveVersionId` = the `PUBLISHED` row (else null); superseded historical rows become `CHANGED`.
- [x] Slug collisions are resolved deterministically (numeric suffix) before adding `@unique`.
- [x] The migration is idempotent (guarded on the legacy `rootId` column) and one-way; rollback is documented as restoring a pre-deploy backup.
- [x] `npx prisma generate` succeeds. (`tsc`/`build` are expected to be red until tickets 02–06 land, as in the taxonomy migration.)

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`. Verify the exact legacy `rootId` semantics (`rootId` equals the first row's id) and the FK column names on `PostCategory`/`PostAuthor`/`_PostToTag` against the migrations before repointing.

Verified against a scratch database seeded with legacy rows: ids reused, `currentVersionId`/`liveVersionId` filled, superseded `PUBLISHED` revisions demoted to `CHANGED`, duplicated `version` numbers renumbered densely per root to satisfy `@@unique([rootId, version])`, links and SEO preserved, slug collisions suffixed, and `prisma migrate diff` reports no difference between the migrated database and `schema.prisma`.

Because Prisma derives the implicit M2M table name from the model names, the join table is renamed `_PostToTag` → `_PostVersionToTag` (columns `A`/`B` unchanged).

**Deviation — `currentVersionId` is the highest `version`, not `isLatest`.** The ticket originally read `currentVersionId` = `isLatest` (else highest `version`). Legacy `isLatest` marks the *live* row: `publish-post.ts` sets it only on `PUBLISHED` and demotes every other revision, while `create-new-version.ts` forks `CHANGED` revisions with `isLatest = false`. Taking `isLatest` would make current == live and strand the in-progress `CHANGED` draft of a published-but-edited post (three such roots exist in production), contradicting the spec's premise that the split separates current from live and breaking the draft preview (`getDraftPostBySlug → currentVersion`) in ticket 02. The migration therefore sets current = highest `version` and live = the `PUBLISHED` row, matching the Page cut-over. The root slug is taken from the live revision when the post is published (preserving public URLs) and from the current revision otherwise.
