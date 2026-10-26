# 03: Optimize critical assets (Lucide, logo, LCP cover)

**What to build:** Reduce icon bundle weight, optimize the logo asset, and prioritize the article cover image so the LCP element paints earlier.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Replace the `import * as LucideIcons` namespace import with an explicit whitelist map of icons used by products.
- [x] Update product icon data or validation so only whitelisted icons can be referenced.
- [x] Replace the 500×500 PNG logo with an SVG or a smaller WebP with srcset.
- [x] Add `fetchPriority="high"` to the article cover image.
- [x] Add `<link rel="preconnect">` to the UploadThing CDN origin used by the custom image loader.
- [ ] Lighthouse desktop LCP improves; total JS weight drops because Lucide is no longer fully bundled.

## Notes

Service feature icons are now a shared whitelist. `src/modules/shop/products/lib/service-feature-icon-names.ts` holds the dependency-free name tuple used by the Zod schema, and `service-feature-icons.ts` maps those names to explicit Lucide imports. The whitelist matches the icons currently stored in `ProductVersion.metadata`:

- `ActivityIcon`
- `BookOpenIcon`
- `FileCodeIcon`
- `MessageSquareIcon`
- `PanelsTopLeftIcon`
- `TargetIcon`
- `UsersIcon`

`serviceMetadataSchema` validates `Icon` with `z.enum(...)`, `ServiceMetadata` narrows `Icon` to the same union, and the admin feature form now renders the allowed icons in a `Select` (it appends `FileCodeIcon` instead of an empty string). `service-boxs.tsx` resolves icons through `getServiceFeatureIcon`, which uses an own-property check and falls back to the default icon for legacy/unknown values instead of crashing on an undefined component.

The visible logo no longer downloads the 500×500 PNG. `Logo` renders `/logo-48.webp` with a 1x/2x/3x density srcset (`logo-48.webp`, `logo-96.webp`, `logo-144.webp`, 1 KB / 2.3 KB / 3.9 KB). `public/logo.png` is still kept because settings metadata/JSON-LD reference `/logo.png`; it was re-encoded from 500×500 (86 KB) to 256×256 (9.3 KB) so those references remain valid and smaller.

`PostTemplate` derives the effective UploadThing origin from the cover URL (`getUploadThingOrigin`, which understands `*.ufs.sh`, `utfs.io`, and legacy `/assets/...` rewrites) and calls `preconnect` only when the article has a cover. The cover image now uses `fetchPriority="high"`; the old `preload` flag was removed because Next.js 16 documents `preload` and `fetchPriority` as alternatives rather than a combination.

Verification:

- `npx tsc --noEmit` passes.
- Full suite: `npm run test:run` — 177 files, 1460 tests passed.
- New `service-feature-icons.test.ts` asserts the whitelist, component resolution/fallback (including prototype keys), schema acceptance for every allowed icon, and rejection of non-whitelisted icons.
- New `logo.test.tsx` asserts the webp density srcset, absence of `/logo.png`, and the reserved 48×48 layout box.
- New `url.test.ts` asserts the preconnect origin resolution for `ufs.sh`, `utfs.io`, legacy `/assets` rewrites, and other relative/non-UploadThing URLs.
- `ANALYZE=true next build --webpack` completes. Lucide now appears as per-icon async chunks for the dynamic icon picker, with no single large synchronous namespace chunk; the service boxes statically pull only the seven whitelisted icons. The build still reports the pre-existing `useTRPC` import warning.
- `npm run lint` still fails on the repository's pre-existing 41 errors (none in the files touched here).
- No Lighthouse run was captured in this environment; compare desktop LCP before/after per the spec's testing decisions.
