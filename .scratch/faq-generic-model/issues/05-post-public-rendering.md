# 05: Post public rendering — FaqSection + FaqPageJsonLd

**What to build:**
Select `faqs { question, answer }` (ordered by `sort asc`) in `getPublishedPostBySlug` (`src/modules/blog/posts/server/queries/get-published-post-by-slug.ts`) and `getDraftPostBySlug` (`draft.ts`). Render `<FaqSection faqs={post.faqs} />` inside `PostTemplate` (`src/modules/blog/posts/ui/public/components/post-template.tsx`) after the body and before `PostBottom`. Render `<FaqPageJsonLd mainEntity={post.faqs} />` in `post-slug-view.tsx` alongside `BlogPostingJsonLd`. Revalidate behavior stays as-is (post edits already revalidate the public route).

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Published and draft post queries include `faqs` ordered by `sort asc`.
- [x] `PostTemplate` renders the FAQ accordion after the article body; empty list renders nothing.
- [x] Published post page emits FAQPage JSON-LD; draft page behavior unchanged as before.