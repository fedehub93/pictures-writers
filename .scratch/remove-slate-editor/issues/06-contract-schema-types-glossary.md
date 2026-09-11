# 06: Contract the schema, shared types, and glossary

**What to build:** The domain no longer has an editor discriminator. The `EditorType` enum and the `Post.editorType` field are removed from the Prisma schema with a migration; the Slate-typed `PrismaJson.BodyData` alias and the editor-type alias are removed from the shared types namespace (the Tiptap alias stays). The glossary drops the "Slate editor" term and records Tiptap as the single rich-text editor for editorial content.

**Blocked by:** 04 (code no longer uses the editor discriminator), 05 (the shared types namespace imports types from the deleted editor).

**Status:** ready-for-agent

- [ ] The `EditorType` enum and the `Post.editorType` field are removed from the Prisma schema
- [ ] A Prisma migration is generated and the migration file is committed
- [ ] The Slate-typed body alias is removed from the shared types namespace; the Tiptap content alias remains and is used everywhere it was
- [ ] The glossary no longer references the Slate editor as a domain concept and records Tiptap as the single rich-text editor
- [ ] Build and lint pass