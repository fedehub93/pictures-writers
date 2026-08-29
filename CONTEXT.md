# Pictures Writers

Glossary for the blog post editing context, including editorial content, editor types, and desktop navigation.

## Post editing

**Post**:
An editorial document managed in the blog CMS, including its content, metadata, SEO settings, and publishing state.
_Avoid_: Article when referring to the CMS entity.

**Heading**:
A structural title inside post content. For the admin outline, headings are the Tiptap `h2`, `h3`, and `h4` blocks.
_Avoid_: Section title when referring to the content node.

**Outline**:
A temporary desktop navigation view derived from the headings in the active Tiptap post editor. It is not persisted as part of the post.
_Avoid_: Table of contents when referring to the admin editing aid.

**Tiptap editor**:
The rich-text editor used to edit the structured JSON content of a post and the source of the admin outline.
_Avoid_: Public table of contents.

**Slate editor**:
The legacy/editor alternative used by posts whose editor type is Slate. The desktop outline does not apply to Slate content.

**SEO panel**:
The post editing area for search metadata such as title, description, canonical URL, social metadata, and indexing directives.
_Avoid_: SEO outline when referring to the contextual helper displayed beside the panel.

**TableContentNode**:
A persistent Tiptap content node that can be inserted into a post for public display. It is separate from the temporary admin outline.
_Avoid_: Outline when referring to persisted post content.
