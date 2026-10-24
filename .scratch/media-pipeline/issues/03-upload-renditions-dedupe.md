# 03: Upload generates renditions, duplicate warnings

**What to build:** Creating a Media from an uploaded image downloads the original once, normalises it (orientation, EXIF stripped, bounded long edge), computes its metadata and checksum, generates the full rendition ladder in AVIF and WebP, uploads them and records the manifest. If the checksum already exists the admin is offered "use the existing one" or an explicit "upload anyway". A failed processing leaves no Media behind.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Uploading an image produces the original plus AVIF and WebP renditions for every ladder width, and the manifest describes exactly the objects that exist.
- [ ] A newly uploaded image is immediately delivered as a rendition at the width the viewport asks for, with no image CPU spent by the server.
- [ ] A duplicate checksum returns the existing Media and the UI offers using it or overriding; overriding creates a second row with its own storage keys.
- [ ] A processing failure creates no Media row and reports the failure to the admin.
- [ ] Uploading a PDF, audio or video file creates no renditions and keeps working exactly as before.
- [ ] Renditions are only generated once per upload; serving the image afterwards never regenerates them.
