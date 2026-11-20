# 02: Serve legacy and remote Media through `/media/<key>`

**What to build:** The same `/media/<key>` address answers for bytes that live on a remote provider: a cacheable `302` to the provider's CDN URL instead of a stream. The existing Installation, still on UploadThing, keeps rendering its existing images, and the keys those images already have resolve through the new route without being renamed. Media rows with no recorded driver are treated as remote. The image loader stops carrying a brand and recognises address shapes rather than hostnames.

**Blocked by:** 01

**Status:** done

- [x] With the remote driver recorded on a Media row, `GET /media/<key>` answers 302 to the provider URL with `Cache-Control: public, max-age=31536000, immutable` on the redirect.
- [x] A flat legacy key with no Installation segment and no recorded driver resolves through the same route and reaches the provider.
- [x] The provider origin for new Media is embedded in the rendition manifest by the processor; for legacy Media without a manifest, the build-time origin constant keeps `/assets/<key>` resolving.
- [x] Key extraction recognises `/media/<key>` in addition to the legacy `/assets/<key>` shape and provider URLs, so a row whose URL is the new shape yields its key.
- [x] The image loader recognises a relative `/assets/` address, a relative `/media/` address and an absolute provider URL, and passes anything else through untouched.
- [x] The own-media host check runs on the server against the Installation's canonical URL, where the absolute form is composed, and is not needed by the loader.
- [x] The legacy `/assets/<key>` rewrite still works for the existing Installation, and `/media/<key>` works for both drivers.
- [x] Loading the public site with the remote driver shows the existing images unchanged, and a newly uploaded Media is served from `/media/`.

## Comments

**2026-11-18** — Closed by `506a2a1b`. The delivery route answers `302` + `Cache-Control: public, max-age=31536000, immutable` for a row recording the remote driver and for a flat legacy key with no recorded driver; an unrecorded driver resolves as remote. New Media store the canonical relative `/media/<key>` for both drivers, and the processor resolves rendition URLs through the driver, so a remote Media carries the provider origin inside its rendition manifest. The loader now recognises address shapes only (relative `/assets/`, relative `/media/`, absolute provider URL) and carries no brand; the own-host check moved server-side into `absoluteMediaUrl`/`isOwnMediaUrl`, which also compose absolute addresses for social metadata, JSON-LD, Stripe checkout images and purchase-email covers. The legacy `/assets/<key>` rewrite is unchanged. The route also resolves rendition keys under a Media's own revision prefix, closing the ticket-01 gap where a local rendition address answered 404.

Verification: `npm run typecheck` clean, `npm run lint` 0 errors (265 pre-existing warnings), `npm run check:doc-citations` 0 broken, `npm run test:run` 273 test files / 2435 tests passed. Evidence for the public-site bullet is the upload → stored URL → loader → provider chain in `route.test.ts` and `media-service.test.ts`; no browser probe was run. ADR-0026 gained a revision note for the delivery hop and the per-row driver.
