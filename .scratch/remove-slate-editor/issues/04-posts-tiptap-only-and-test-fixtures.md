# 04: Posts become Tiptap-only and test fixtures follow

**What to build:** The Post content model stops discriminating between editors. The `EditorType` selector disappears from the post admin UI, post schemas, and public render paths; every Post renders `tiptapBodyData` unconditionally. Both post creation flows (tRPC procedure and the legacy post REST route) stop seeding a Slate-shaped default body — the REST route stays for the home-facing search flows but no longer writes the legacy body column. Test fixtures that modeled the old Slate document shape (scheduler and blog post publish/schedule tests) are updated to the Tiptap document shape so the existing tests stay meaningful against the single content model.

**Blocked by:** 01 (the legacy body column must be nullable so creates can omit it).

**Status:** done

- [x] The admin post UI offers no editor choice; `tiptapBodyData` is the only body field
- [x] Post schemas no longer reference the editor discriminator
- [x] Public post views and the post template render `tiptapBodyData` unconditionally
- [x] tRPC post creation and the legacy post REST route no longer seed a Slate-shaped default body and no longer write the legacy body column
- [x] Test fixtures in the scheduler and blog post tests use the Tiptap document shape
- [x] Build and lint pass; existing Vitest tests pass

## Comments

- Implemented and committed as `7d57703` on `refactor-remove-slate`.
- Migration `20260911120000_remove_editor_type_from_post`: drops the `editorType` column and `EditorType` enum from Post. Applied to the test database (via `prisma migrate deploy` in the Vitest global setup).
- `npx tsc --noEmit` passes (exit 0). Full test suite passes: 24 files / 209 tests.
- `npm run lint` (84 errors) fails on the base commit too; the error set is byte-identical before and after this change (0 new errors). All 84 errors live in unrelated files (Slate editor tree, forms builder, mails, shared UI — tracked in ticket 05).
- Code review: all spec checkpoints satisfied. Review flagged broken indentation in `get-posts-grouped-by-root-id.ts`, missing trailing newlines in 3 files, duplicated test literals, and `bodyData` still present in the update schema — all fixed in the same commit. Baseline smell observations (Primitive Obsession on `z.any()`, Middle Man on `post-details-form.tsx`) noted but left for follow-up since they predate this ticket.
