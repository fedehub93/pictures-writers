# 05: Document migration utility

**What to build:** A one-off, idempotent utility converts existing Site region documents from the old flat block props to the new nested `content` shapes, so development headers and footers saved before this work open in the editor without hand editing. The Top bar is excluded because its concept changed and is recreated instead. The utility runs outside the request path and changes no database schema or API.

**Blocked by:** 01, 02, 03, 04 (all new block shapes must exist first)

**Status:** ready-for-agent

- [ ] The utility converts the old Brand, Search bar, NavbarBlock, Link list and Copyright flat props into their new nested `content` shapes.
- [ ] Documents that already use the nested shapes are left unchanged.
- [ ] Running the utility twice produces the same document as running it once.
- [ ] Announcement bar entries are not converted; the document owner recreates the Top bar in the editor.
- [ ] Unknown component types and malformed component props are preserved or skipped without throwing, so one bad document cannot abort the run.
- [ ] The utility reports what it changed per document.
- [ ] Tests cover each converted shape, idempotency, already-migrated documents and unknown or malformed data using representative fixtures.
- [ ] No Prisma schema, tRPC procedure or Site region versioning change is introduced.
- [ ] Type checking, targeted linting and the full test suite pass.
