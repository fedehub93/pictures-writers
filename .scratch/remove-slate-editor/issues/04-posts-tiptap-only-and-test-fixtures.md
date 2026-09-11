# 04: Posts become Tiptap-only and test fixtures follow

**What to build:** The Post content model stops discriminating between editors. The `EditorType` selector disappears from the post admin UI, post schemas, and public render paths; every Post renders `tiptapBodyData` unconditionally. Both post creation flows (tRPC procedure and the legacy post REST route) stop seeding a Slate-shaped default body — the REST route stays for the home-facing search flows but no longer writes the legacy body column. Test fixtures that modeled the old Slate document shape (scheduler and blog post publish/schedule tests) are updated to the Tiptap document shape so the existing tests stay meaningful against the single content model.

**Blocked by:** 01 (the legacy body column must be nullable so creates can omit it).

**Status:** ready-for-agent

- [ ] The admin post UI offers no editor choice; `tiptapBodyData` is the only body field
- [ ] Post schemas no longer reference the editor discriminator
- [ ] Public post views and the post template render `tiptapBodyData` unconditionally
- [ ] tRPC post creation and the legacy post REST route no longer seed a Slate-shaped default body and no longer write the legacy body column
- [ ] Test fixtures in the scheduler and blog post tests use the Tiptap document shape
- [ ] Build and lint pass; existing Vitest tests pass