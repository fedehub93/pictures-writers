# 14: The contract — Media loses its storage columns

**What to build:** Once production carries a stored-file record for every file, the Media stops carrying a copy of the storage facts. Its key, address, size, content type, checksum and driver disappear, and the canonical address is composed by one function from the file's key and role. Nothing about the product's behaviour changes; what disappears is the chance of two records disagreeing.

**Blocked by:** 13, 04

**Status:** ready-for-agent

- [ ] The Media no longer stores a key, an address, a size, a content type, a checksum or a driver.
- [ ] Exactly one composer produces a canonical address, and no other code builds one.
- [ ] Every read that used a Media's storage column now reads the stored-file record.
- [ ] The library, delivery, quota, audit and both backfills behave as before.
- [ ] A migration ships with the schema change, and a rolling deploy stays compatible: the old container never reads a column the new one has dropped.
- [ ] The full suite is green.
