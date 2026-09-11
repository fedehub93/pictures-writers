# 06: Contract the schema, shared types, and glossary

**What to build:** The domain no longer has an editor discriminator. The `EditorType` enum and the `Post.editorType` field are removed from the Prisma schema with a migration; the Slate-typed `PrismaJson.BodyData` alias and the editor-type alias are removed from the shared types namespace (the Tiptap alias stays). The glossary drops the "Slate editor" term and records Tiptap as the single rich-text editor for editorial content.

**Blocked by:** 04 (code no longer uses the editor discriminator), 05 (the shared types namespace imports types from the deleted editor).

**Status:** done

- [x] The `EditorType` enum and the `Post.editorType` field are removed from the Prisma schema
- [x] A Prisma migration is generated and the migration file is committed
- [x] The Slate-typed body alias is removed from the shared types namespace; the Tiptap content alias remains and is used everywhere it was
- [x] The glossary no longer references the Slate editor as a domain concept and records Tiptap as the single rich-text editor
- [x] Build and lint pass

## Comments

- Schema and migration (drops `EditorType` enum and `Post.editorType` column) landed as `7d57703`; the Slate-typed `PrismaJson.BodyData` alias was dropped with the removed editor tree in `57e6064`.
- This ticket's remaining work — the glossary — completed here: `CONTEXT.md` drops the "Slate editor" term and records Tiptap as the single rich-text editor for editorial content; `AGENTS.md` now lists only TipTap under rich text.
- `npx tsc --noEmit` passes (exit 0). `npm run lint` reports the pre-existing error set (all in unrelated files, tracked with ticket 05).
- Code review: spec checkpoints all satisfied; no scope creep. Standalone findings (cosmetic): the migration's `-- DropForeignKey` comment and `"public"."..."` quoting are Prisma-generated artifacts; `Post.bodyData` remains as an untyped legacy column, kept read-only by design.