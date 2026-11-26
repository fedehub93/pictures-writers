# 02: Remove relational-reference information from the library

**What to build:** The library stops showing the relational-reference count anywhere. The muted usage note under the panel header, the "Used in" row and its tooltip in the details column, and the reference counts in the archive and delete dialogs all disappear. The list read stops computing a count per row because the UI no longer uses it. The server guard that refuses to permanently delete a Media still in use remains, and its refusal now explains the situation without a number or a caveat about rich text.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Decisions

- Only what is visible is removed. The deletion guard is not weakened: an archived Media referenced by content is still refused.
- The refusal message drops the count and the rich-text caveat. It states that the Media is still used by content and that those uses must be removed first. The error keeps its structured usage value for callers and tests.
- The per-row reference read leaves the list procedure; the response no longer carries a usage count. The counting service itself stays because the deletion guard and the archive tests use it.
- The details column keeps size, dimensions, MIME, checksum, storage driver, public URL, created and updated. Folder details are unchanged.
- The panel header keeps only the bulk-action slot, rendered only while something is checked.

## Checklist

- [ ] The usage note no longer renders under the My Drive / Archived panel header.
- [ ] The details column no longer renders a "Used in" row or its tooltip; all other Media facts and the folder variant are unchanged.
- [ ] The card archive and delete dialogs no longer quote reference counts or the rich-text caveat, and still confirm the action clearly.
- [ ] The list response carries no per-row usage count and the list read performs no reference count.
- [ ] Permanently deleting an archived Media that content still references is still refused, with the new wording and no number.
- [ ] The router test that asserted per-row counts is replaced by one asserting the response has none; the details and card tests are updated.
- [ ] The existing archive and deletion guard tests still pass.
- [ ] `npm run lint`, `npm run typecheck` and the test suite pass.
