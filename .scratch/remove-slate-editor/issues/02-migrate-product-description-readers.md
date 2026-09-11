# 02: Migrate all Product.description readers to tiptapDescription

**What to build:** Every place that reads the legacy `Product.description` column switches to `tiptapDescription`. The public ebook rendering path (product page, draft page, shared ebook-info component) renders `tiptapDescription` with the existing public Tiptap renderer. Public product queries stop selecting the legacy column. Transactional email generation for webinars and ebooks reads `tiptapDescription`. No application code reads the legacy column after this ticket.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Ebook product pages (published and draft) render `tiptapDescription` via the shared Tiptap renderer
- [ ] The ebook product page renders correctly for the existing migrated ebook
- [ ] Product queries used by public pages no longer select the legacy description column
- [ ] Webinar and ebook transactional emails embed `tiptapDescription`
- [ ] No code in the public render path or email path reads the legacy description column
- [ ] Build and lint pass