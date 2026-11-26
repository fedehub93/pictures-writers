# Spec: Media folders, tree view and details panel

## Problem Statement

The admin Media library is currently a flat, paginated grid. As the number of uploaded files grows, editors struggle to locate assets, there is no way to group related Media together, and the page provides no at-a-glance summary of how storage is consumed by file type. The existing UI also does not expose rich metadata or usage facts for a selected file in a dedicated surface.

## Solution

Introduce **Media folders** as an organizing layer inside the Media library. The admin page gains a left sidebar with a collapsible tree of folders, a main grid that shows both folders and Media, a read-only details panel on the right for the selected item, and a storage-details widget that breaks usage down by Media type. Uploads are placed in the currently selected folder, and files can be moved between folders through a bulk or context action.

## User Stories

1. As an editor, I want to create named folders inside the Media library, so that I can group related assets by project, campaign or content area.
2. As an editor, I want to create nested folders, so that I can organize large libraries hierarchically.
3. As an editor, I want to see the folder tree in a left sidebar, so that I can navigate the library without losing context.
4. As an editor, I want the sidebar to remember which folders I expanded, so that navigation feels stable during a session.
5. As an editor, I want to click a folder in the grid to open it, so that I can browse the library in the same way I browse files on my computer.
6. As an editor, I want a breadcrumb or highlighted tree node showing where I am, so that I do not get lost inside nested folders.
7. As an editor, I want to upload a file directly into the folder I am currently viewing, so that I do not have to move it afterwards.
8. As an editor, I want to move one or more Media into another folder, so that I can reorganize the library efficiently.
9. As an editor, I want to rename a folder, so that I can fix typos or update naming conventions.
10. As an editor, I want to delete an empty folder, so that I can remove folders I no longer need.
11. As an editor, I want to be prevented from deleting a folder that contains Media, so that I do not accidentally lose organized assets.
12. As an editor, I want the system to prevent a folder from being moved inside one of its own descendants, so that the hierarchy never contains cycles.
13. As an editor, I want the search to work across the whole library or inside the current folder, so that I can choose the scope of my search.
14. As an editor, I want a "Recent" view that shows the latest uploaded Media regardless of folder, so that I can quickly find files I just added.
15. As an editor, I want the existing "Archived" view to remain available, so that archived Media can still be found and restored without cluttering folders.
16. As an editor, I want to click a Media card and see its details in a right panel, so that I can inspect metadata without opening a modal.
17. As an editor, I want the details panel to show file type, size, dimensions, MIME type, checksum, storage driver, usage count, created and updated dates, so that I have the facts I need.
18. As an editor, I want the details panel to show the public URL of a Media, so that I can copy it for external use.
19. As an editor, I want the details panel to behave the same way for folders, showing item count, total size and dates, so that folders are first-class objects.
20. As an editor, I want a storage-details widget that shows total used vs total quota, so that I know how much space is left.
21. As an editor, I want the storage-details widget to break usage down by Images, Videos, Audio and Documents, so that I can see which file types consume the most space.
22. As an editor, I want the storage-details widget to warn me when the quota is nearly full, so that I can clean up before uploads are refused.
23. As an editor, I want the existing grid layout and bulk actions to keep working, so that the new features feel like an enhancement, not a replacement.
24. As a maintainer, I want folder operations to be permission-gated, so that only authorized backoffice users can reorganize the library.
25. As a maintainer, I want the new model to keep archived Media out of the folder hierarchy, so that archived and active assets do not mix in confusing ways.

## Implementation Decisions

- **Domain model: `MediaFolder`**  
  A `MediaFolder` is a container that organizes `Media` in the library. It has a display name and an optional self-referential parent relationship, enabling nested folders. The term is added to `GLOSSARY.md` as **Media folder**.

- **`Media` gains a nullable `folderId`**  
  A Media can optionally belong to exactly one folder. Media without a folder live at the root of My Drive. The existing `archivedAt` column remains the authority for archived status and is orthogonal to folder membership.

- **Archived Media stay outside folders**  
  The folder tree and folder-scoped grid show only active Media. The existing "Archived" view continues to list archived Media globally. This keeps the hierarchy clean and avoids ambiguity about whether an archived file inside a folder should still be counted as "in" that folder.

- **Sidebar nodes**  
  The sidebar exposes three top-level navigational items:
  - **My Drive**: the folder tree rooted at the implicit root.
  - **Recent**: a flat view of the latest active Media, newest first, ignoring folder membership.
  - **Archived**: the existing archived view.

- **Tree structure is built server-side**  
  The tRPC layer returns the folder tree as nested data. The client renders it using shadcn primitives (`Collapsible`, `ScrollArea`, `Button`, `Icons`) rather than introducing a third-party tree component.

- **Folder display in the grid**  
  When a folder is opened, the grid lists both its child folders and the Media directly inside it. Folders are rendered as cards with a folder icon, name and item count. Clicking a folder card navigates into it.

- **Upload target folder**  
  The upload action knows the currently selected folder. If the current view is "Recent" or "Archived", uploads land at the My Drive root.

- **Move action instead of drag & drop**  
  Media are moved between folders through a context-menu / bulk "Move to folder" action in the first iteration. Drag-and-drop is a future enhancement.

- **Details panel is read-only**  
  The right panel shows metadata for the selected item. Editing (name, alt text) and destructive actions (archive, replace, delete) remain in the existing card actions and bulk toolbar so that the panel does not become a second control surface.

- **Storage details aggregation**  
  The breakdown groups Media by `MediaType` (`IMAGE`, `VIDEO`, `AUDIO`, `FILE`) and sums the sizes of their stored originals. Whether generated renditions are included is a spec detail to confirm during implementation; the initial default is to count originals only, because renditions share the same storage quota and are not independent Media.

- **No folder slug or public URL**  
  Folders are identified by their database id. There is no slug, no public route and no shareable folder link in this iteration.

- **Permissions**  
  Folder CRUD and move operations reuse the existing `MEDIA_CREATE`, `MEDIA_UPDATE` and `MEDIA_DELETE` permissions. No new permission area is introduced.

- **API contracts**
  - `media.getMany` accepts an optional `folderId` and supports a `recent` view in addition to `active`/`archived`.
  - `media.getMeta` returns the total count and quota for the current scope, plus the data needed by the storage-details widget.
  - New tRPC mutations: `media.createFolder`, `media.updateFolder`, `media.deleteFolder`, `media.moveMedia`.
  - `POST /api/media` accepts an optional `folderId` field and assigns it to the created Media.

- **Anti-cycle validation**  
  Before updating a folder's parent or moving a folder, the server validates that the operation does not create a cycle in the tree.

## Testing Decisions

- **Test external behavior, not implementation details.**  
  Tests assert on the shape of the returned data, the state of the database after an operation, and the rendered DOM, not on internal helper names or component props.

- **Database seam tests**  
  Verify the migration applies cleanly, that `folderId` can be set and queried, and that the FK behaves on delete (e.g. deleting a folder should fail or require explicit handling if it still contains Media).

- **Server seam tests**  
  Extend the existing `media-router.test.ts` style to cover folder CRUD, tree retrieval, media filtering by folder, move operations and cycle prevention. Extend `route.test.ts` to cover upload with and without `folderId`.

- **Domain seam tests**  
  Pure unit tests for tree building from flat rows and cycle detection, using fabricated in-memory data.

- **UI seam tests**  
  Use `happy-dom` (with `// @vitest-environment happy-dom`) and `createRoot` + `act`, following the repo's existing component-test pattern. Assert that the tree renders folders, that selecting a folder updates the grid, that the details panel shows the right fields, and that the storage-details widget renders the expected breakdown.

- **Manual / browser-probe checklist**  
  Nested expand/collapse persistence, hover/focus states and responsive layout of the three-pane view are verified with the browser probe because happy-dom cannot reproduce iframe-free layout interactions reliably.

## Out of Scope

- Drag-and-drop of files or folders.
- Moving folders themselves (only Media can be moved between folders in this iteration).
- Folder-level permissions or shared folders between users.
- Folder slugs, public folder pages or shareable folder links.
- Bulk operations on folders (delete/rename multiple folders at once).
- Automatic cleanup of empty folders.
- Including renditions in the storage-details breakdown (unless explicitly promoted during implementation).
- Folders for `Attachment` or `Avatar` stored files; folders are a Media-library concept only.

## Further Notes

- The existing `MEDIA_USAGE_NOTE` about relational reference counts remains valid and should still be shown near bulk actions.
- The component that renders a folder card and the component that renders a Media card should share layout conventions (card size, hover state, selection outline) so the grid feels homogeneous.
- The right details panel should clear or show a placeholder when nothing is selected, and it should update immediately when the selection changes.
- Because `MediaFolder` is a new domain term, update `GLOSSARY.md` under the Media section before closing the implementation tickets.
- The storage-details widget can be placed either under the tree view in the sidebar or horizontally between "Recent" and "My Files"; the final placement is a UI decision during implementation, but the data contract should support both.
