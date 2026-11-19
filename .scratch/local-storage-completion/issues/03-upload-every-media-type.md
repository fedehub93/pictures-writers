# 03: Upload every Media type through the application transport

**What to build:** An admin can upload an image, a document, an audio file or a video through the same transport, with local disk active. The bytes are written by the active Storage driver, the Media records the driver that wrote it, the quota counts the real bytes, and the file is served from the site's own domain. Images keep the 4 MB limit; non-images get 16 MB. A refused upload leaves nothing behind and answers with a machine-readable reason.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] With local active, an image within 4 MB and a document, audio file and video within 16 MB upload through the multipart transport, and each row records local as its driver.
- [ ] Each uploaded file is served from the site's own domain with the correct content type; documents, audio and video answer Range requests.
- [ ] Oversize, quota exceeded, unclassifiable type and duplicate each return a distinct machine-readable error.
- [ ] A refused or failed upload leaves no bytes on disk and no row.
- [ ] The quota counts a non-image's bytes and still counts archived Media.
- [ ] The admin library accepts a non-image file and shows it as a Media with its own preview.
- [ ] End-to-end tests cover upload to delivery for image, document, audio and video, on a temporary local root, with the environment still naming UploadThing.
