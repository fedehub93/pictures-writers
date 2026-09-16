# 04: Post admin UI — dropdown trigger + ResponsiveDialog FAQ editor

**What to build:**
Generalize the product FAQ editor into a reusable field-array form (reorder, add, remove, question/answer inputs) and reuse it inside a `ResponsiveDialog`. In `src/modules/blog/posts/ui/admin/views/post-id-view.tsx` add a `DropdownMenu` in the sidebar area with a single "FAQ" item that opens the dialog. Field values live on `faqs` in the post update input; persistence uses the existing `updatePost` mutation (`trpc.posts.update`) with `{ id, rootId, faqs }`.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Shared FAQ field-array form component exists (generalizing `product-faq-form.tsx`) and is reused by both product and post editors.
- [x] Post sidebar shows a "FAQ" dropdown item that opens `ResponsiveDialog` (drawer on mobile, dialog on desktop).
- [x] Saving within the dialog calls `updatePost` with `faqs` and invalidates post queries; empty list is allowed.