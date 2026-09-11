# Pictures Writers

Glossary for the blog post editing context, including editorial content and desktop navigation.

## Post editing

**Post**:
An editorial document managed in the blog CMS, including its content, metadata, SEO settings, and publishing state.
_Avoid_: Article when referring to the CMS entity.

**Scheduled publication**:
A publication instruction that makes the latest saved eligible version of a Post public at a future date and time chosen by the editor.
_Avoid_: Delayed post, queued article.

**Heading**:
A structural title inside post content. For the admin outline, headings are the Tiptap `h2`, `h3`, and `h4` blocks.
_Avoid_: Section title when referring to the content node.

**Outline**:
A temporary desktop navigation view derived from the headings in the active Tiptap post editor. It is not persisted as part of the post.
_Avoid_: Table of contents when referring to the admin editing aid.

**Tiptap editor**:
The single rich-text editor for editorial content (posts, product descriptions). It produces structured JSON content and is the source of the admin outline.
_Avoid_: Public table of contents.

**SEO panel**:
The post editing area for search metadata such as title, description, canonical URL, social metadata, and indexing directives.
_Avoid_: SEO outline when referring to the contextual helper displayed beside the panel.

**TableContentNode**:
A persistent Tiptap content node that can be inserted into a post for public display. It is separate from the temporary admin outline.
_Avoid_: Outline when referring to persisted post content.

## Public rendering

**On-demand revalidation**:
The mechanism (`revalidatePath`) that regenerates and re-caches a public route at publish/edit time so content changes go live without a full application build.
_Avoid_: Rebuild, deploy-on-publish when referring to the retired webhook-build flow.

**Route-level invalidation**:
Invalidating a whole URL path (or segment, via `revalidatePath(path, 'layout')`) rather than individual cached data. This is the chosen granularity because public pages read directly from the database.
_Avoid_: Tag-based invalidation when referring to the chosen approach.

**ISR backstop**:
The coarse time-based `revalidate` value on public routes (24h) that self-heals content if an on-demand revalidation is missed. It is a safety net, not the source of freshness.
_Avoid_: Cache TTL when referring to the strategy.
