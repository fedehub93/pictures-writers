# Spec: Remove the Slate rich-text editor

**Status:** ready-for-agent

## Problem Statement

The application maintains two rich-text editing stacks: the legacy Slate editor and Tiptap. All editorially authored content — blog Posts and shop Products (webinar, service, ebook) — has now been migrated to Tiptap and is written through `tiptapBodyData` / `tiptapDescription`. The Slate stack is dead weight:

- 5 npm packages (`slate`, `slate-dom`, `slate-history`, `slate-hyperscript`, `slate-react`)
- The whole admin editing experience under the admin editor directory (~40 files)
- The public-facing renderer tree for Slate content
- The `EditorType` discriminator (`SLATE` / `TIPTAP`) on Posts, which no longer discriminates anything
- Database columns (`Post.bodyData`, `Product.description`) that are no longer written by any UI

The codebase still contains inconsistencies and legacy branches that complicate every future change: a product admin form that no longer binds the Slate editor but whose schema and API routes still carry a Slate-typed description; public ebook pages that render the legacy Slate column instead of the migrated Tiptap column; transactional emails that read the Slate column; and renderer/query code split between the two formats.

## Solution

Remove the Slate stack entirely, making Tiptap the single rich-text editor for the whole application.

- All Slate packages are removed from dependencies.
- The admin Slate editor and the public Slate renderer are deleted.
- The `EditorType` enum and the `editorType` discriminator are removed from the domain, schema, admin UI, and public render paths. Posts are no longer conditionally rendered by editor type; Tiptap content is the one content model.
- The legacy columns `Post.bodyData` and `Product.description` are kept in the database but become read-only legacy storage: no code path writes them anymore. They are made nullable in the schema so the code can stop providing them, and are dropped in a later, separate effort once the removal is verified.
- Products (ebooks included) read and render `tiptapDescription` exclusively, reusing the existing public Tiptap renderer.
- Transactional emails read `tiptapDescription` for both webinars and ebooks.
- Test fixtures that modeled the old Slate document shape are updated to the Tiptap shape.
- The shared glossary is updated: the "Slate editor" term is removed.

## User Stories

1. As an administrator, I want every Post I edit to open in the Tiptap editor, so that there is a single consistent editing experience.
2. As an administrator, I want the admin never to ask me which editor a Post uses, so that I don't have to know technical history.
3. As an administrator, I want the product form to work with Tiptap descriptions only, so that there is no dead form field.
4. As a public visitor, I want blog Posts to render identically regardless of which editor wrote them, so that my reading experience is consistent.
5. As a public visitor, I want ebook product pages to render their description correctly, so that migrated ebooks are not damaged by the removal.
6. As a public visitor, I want webinar and service product pages to keep rendering their descriptions, so that the removal does not regress them.
7. As an email recipient, I want webinar and ebook emails to embed the current product description, so that the announcement email reflects the edited content.
8. As a developer, I want the codebase free of Slate imports, so that type-checking and linting catch any accidental reintroduction.
9. As a developer, I want the database to keep its legacy columns untouched during the removal, so that I can verify the migration before dropping them in a separate step.
10. As a developer, I want the `EditorType` discriminator gone from queries and render branches, so that there is a single content model to reason about.

## Implementation Decisions

- **Single editor**: Tiptap is the sole rich-text editor. All Slate packages are removed from `package.json`.
- **Admin editor deletion**: The admin Slate editor subtree (editor core, editor-input, toolbar, plugins, element renderers, helpers) is deleted wholesale. The Tiptap editor already covers the same functionality (including HTML paste handling, normalization, links, embeds, undo/redo).
- **Public renderer deletion**: The public Slate renderer (`SlateRendererV2` and its element/leaf/helper tree) is deleted. The existing `TipTapRendererV2` is the single public renderer for editorial content.
- **No more `EditorType`**: The `EditorType` enum and the `Post.editorType` field are removed from the domain and the Prisma schema (with a migration). Post admin UI no longer offers an editor choice; post schemas drop the discriminator; public post views render `tiptapBodyData` unconditionally.
- **Legacy columns kept read-only**: `Post.bodyData` and `Product.description` remain in the database but are not written or read by application code. They become `Json?` (nullable) in the Prisma schema so code can omit them; their Slate-typed `PrismaJson.BodyData` alias is removed from the shared types namespace. The actual column drop is explicitly out of scope (separate later effort after verification).
- **Ebook migration**: The ebook public rendering path (and the shared ebook-info component) switches from the legacy description column to `tiptapDescription`, reusing `TipTapRendererV2`. Product public queries stop selecting the legacy column.
- **Product admin write-path**: The product schema no longer validates a Slate-typed description; the product form no longer carries a description field; product create/update/versioning API routes and helpers stop writing the legacy column.
- **Transactional emails**: Webinar and ebook email generation reads `tiptapDescription` instead of the legacy description column.
- **Posts create flows**: Both post creation paths (tRPC procedure and the legacy post REST route) stop seeding a Slate-shaped default body. The REST route itself stays — the home-facing search flows consume it without a tRPC wrapper.
- **Glossary**: `CONTEXT.md` drops the "Slate editor" term; the glossary records Tiptap as the single rich-text editor for editorial content.

## Testing Decisions

- The highest seam is compile-time: TypeScript strict plus lint must pass. Once nothing imports from the Slate packages, removing them breaks the build if any reference was missed. This is automatic verification of the whole removal.
- The test fixtures that model editorial document content (scheduler tests, blog post publish/schedule tests) are updated from the Slate document shape to the Tiptap document shape, so existing Vitest tests remain meaningful against the sole content model. These tests are the prior art for content-shape fixture usage in this repo.
- Public render behavior is verified at the component level where the switch is visible: post templates render `tiptapBodyData` unconditionally, and the ebook product page renders `tiptapDescription`. A manual check of the single existing ebook is expected.

## Out of Scope

- Dropping the `Post.bodyData` and `Product.description` columns from the database. This is a separate effort to be run after the removal is verified in production.
- Back-migrating any historical Slate data. All authored content is already in Tiptap form.
- Replacing the legacy post REST route or its home-facing consumers with tRPC. Those flows are untouched.
- Any feature work in the Tiptap editor itself.

## Further Notes

- The admin product editor has been Tiptap-bound for some time while public ebook rendering and transactional emails still read the legacy column; this spec resolves that inconsistency.
- Products do not go through tRPC — their admin CRUD flows through the legacy REST routes. Those routes are updated in place, not rewired.