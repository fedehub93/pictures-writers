# 05: Remove the Slate sources and packages

**What to build:** The Slate stack disappears. The admin Slate editor subtree is deleted, the public Slate renderer tree is deleted, the orphaned legacy product-info component is deleted, and the five Slate npm packages are removed from dependencies. This is the contract step: it stays green because every reference was already removed in 02, 03, and 04.

**Blocked by:** 02, 03, 04 (no code may still reference Slate sources or packages).

**Status:** done

- [x] The admin Slate editor subtree (editor core, editor-input, toolbar, plugins, element renderers, helpers) is deleted
- [x] The public Slate renderer tree (renderer, elements, leaves, helpers) is deleted
- [x] The orphaned legacy product-info component is deleted
- [x] The five Slate packages are removed from `package.json`
- [x] No file in the repository imports from any Slate package
- [x] Build and lint pass

## Comments

- Implemented and committed on `refactor-remove-slate`.
- Deleted the admin Slate editor subtree (`src/app/(admin)/_components/editor/`, 36 files), the public Slate renderer tree (`src/shared/components/editor/`, 21 files), and the orphaned `generic-editor.tsx` form wrapper whose only reference was a commented-out block in `product-details-form.tsx` (that dead block was removed too).
- The orphaned `product-info.tsx` component was already deleted in `418691e` (ticket 02); verified nothing with that name remains.
- Removed the five Slate packages (`slate`, `slate-dom`, `slate-history`, `slate-hyperscript`, `slate-react`) plus the orphaned helpers `is-hotkey`, `is-url`, and `image-extensions` (with their `@types/*`), all grep-verified to only serve the deleted tree. `package-lock.json` regenerated.
- Dropped the `CustomElement` import and the Slate-typed `PrismaJson.BodyData` alias from `src/types.ts` — the tree deletion makes the import unresolvable, so the contract step stays green.
- Verification: `npx tsc --noEmit` exit 0; `npm run build` exit 0; full Vitest suite green (24 files / 209 tests); `npm run lint` dropped 84→73 errors / 390→328 warnings, all reductions from the deleted tree, no new issues in touched files.
- `CONTEXT.md` glossary and `EditorType` schema work remain in ticket 06.