# 05: Archive, restore, permanent deletion, usage count

**What to build:** Archiving a Media removes it from the library while keeping it served and referenceable, restoring brings it back, and permanent deletion is a separate explicit act available only on archived Media that removes the row and its whole storage prefix. The library shows how many contents reference a Media and states that references embedded in rich text or page data are not counted. Deleting a Media used as a cover no longer silently removes that cover.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Archiving hides the Media from the library while its URLs keep working and published pages are unaffected.
- [ ] Restoring an archived Media makes it visible again.
- [ ] Permanent deletion is refused on a Media that is not archived.
- [ ] Permanent deletion removes the row and every object under its prefix, leaving no orphaned renditions.
- [ ] The library shows the number of relational references per Media and labels the count as excluding references embedded in content data.
- [ ] Deleting or archiving a Media that is used as a cover no longer makes that cover disappear without a warning.
