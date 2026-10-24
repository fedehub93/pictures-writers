# 01: Storage seam - UploadThing and local drivers

**What to build:** A server-only storage seam with two real implementations: UploadThing for production and local disk for tests and future installs. Writing, reading, addressing and deleting an object go through the same interface, so no other module ever talks to a provider SDK directly.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] An object written through either driver can be read back byte-identical and addressed by a public URL.
- [x] Deleting a prefix removes every object under it and leaves sibling keys untouched.
- [x] A missing key produces an explicit, typed error instead of a silent no-op.
- [x] Both drivers pass one shared contract test; the local driver runs against an isolated temporary directory.
- [x] Selecting the driver is pure configuration; no feature reads storage credentials outside the driver factory.

## Notes

The seam lives in `src/modules/media/server/storage/` (`StorageDriver`, `createStorageDriver`, `getStorageDriver`). The UploadThing driver addresses objects by UploadThing `customId` set to the storage key, so deterministic `<mediaId>/<revision>/...` keys and prefix deletion work even though UploadThing generates its own file keys. The shared contract runs the local driver on a fresh `mkdtemp` directory per test and the UploadThing driver against an in-memory fake of the SDK in `__tests__/fake-uploadthing.ts`.

