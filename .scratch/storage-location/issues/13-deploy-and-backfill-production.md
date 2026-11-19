# 13: [human] Deploy and backfill the location in production

**What to build:** The existing Installation runs the new model on its real data: the media branch (delivery route, volume, quota, audit) is in production if it is not already, then the one-time command creates a stored-file record for each of the 720 Media, recording each absolute provider address as its remote location. This is the gate that lets the code stop reading the Media's storage columns.

**Blocked by:** 02, 03, 04

**Status:** ready-for-human

- [ ] The media branch is deployed with its migrations and the persistent volume mounted at its documented root.
- [ ] The command creates 720 stored-file records and no duplicates.
- [ ] Each of the 720 answers 200 on its canonical address.
- [ ] The audit is green, with zero unresolved files.
- [ ] A database dump taken afterwards restores into a scratch database with the records intact.
- [ ] The Installation's active driver is recorded explicitly, so the default change cannot move any of its files.
