# 01: Folder tree sidebar

**What to build:** An editor can create, rename and delete nested folders, and see them in a collapsible tree in the left sidebar under "My Drive".

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Migration adds `MediaFolder` table and nullable `folderId` column on `Media`.
- [x] Prisma model `MediaFolder` supports self-referential parent/children.
- [x] tRPC procedures exist for `createFolder`, `updateFolder`, `deleteFolder` and `getFolderTree`.
- [x] Updating a folder's parent is rejected if it would create a cycle.
- [x] Deleting a folder is rejected if it still contains Media or subfolders.
- [x] The sidebar renders a collapsible tree rooted at "My Drive" using shadcn primitives.
- [x] `GLOSSARY.md` defines the term **Media folder**.
- [x] Router tests cover CRUD, nesting and cycle prevention.
- [x] Component test renders the tree with sample folders.

## Comments

**2026-11-24 — landed in a1952ac4.**

`MediaFolder` is a self-referential model with a nullable `Media.folderId`; both
foreign keys are `RESTRICT`, so the database also refuses a folder that still
holds Media or a child. Folder writes take one advisory lock inside a
transaction, because the cycle check and the delete guard both read before they
write and two concurrent requests could otherwise each pass their own check.
`buildFolderTree` and `wouldCreateCycle` are pure functions in
`src/modules/media/lib/media-folder.ts`; the procedures reuse `MEDIA_CREATE`,
`MEDIA_UPDATE` and `MEDIA_DELETE`.

The sidebar is `media-folder-sidebar.tsx` (reads, mutations, dialogs) over
`media-folder-tree.tsx` (presentational, shadcn `Collapsible`, `ScrollArea`,
`DropdownMenu`). Expansion is controlled by the sidebar so a subfolder created
under a collapsed branch is revealed; open branches survive a tree refetch for
as long as the sidebar is mounted.

Verification: `npm run typecheck` clean; `npx eslint` clean on every changed
file (the full lint keeps only the repository's pre-existing warnings);
`npm run test:run` 299 files / 2709 tests passed; `npm run build:agent`
succeeded against `pictures_writers_agent` after applying the migration. The
new coverage is 8 pure tree/cycle tests, 13 router tests (CRUD, nesting,
positive and refused moves, delete guards including the raw FK refusal) and 2
happy-dom tests for the rendered tree. No browser probe ran; the manual
expand/collapse and responsive checks belong to the three-pane view in ticket
03, where the grid gains folder scoping.

Ticket 03 still owns the view half of the archive decision: the folder-scoped
grid and tree must show active Media only, so an archived Media that keeps its
`folderId` never appears inside a folder. Deletion deliberately counts archived
Media too, because a folder is only deletable when nothing points at it.
