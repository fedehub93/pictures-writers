# 01: Lazy-load form builder properties components

**What to build:** Remove TipTap/ProseMirror from the public form runner bundle by loading each form element's properties editor only when the form designer needs it.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] The form builder registry keeps one registry, but each element's `index.tsx` lazy-loads its properties component.
- [x] The public form runner still resolves form elements, schemas, and initial values correctly.
- [x] The admin form designer still renders and edits element properties correctly.
- [ ] Bundle analyzer shows TipTap removed from initial public chunks (homepage, article, product detail).
- [ ] Lighthouse mobile score improves compared to the baseline.

## Notes

Every form element and layout `index.tsx` now declares its `propertiesComponent` with `React.lazy(() => import("./properties-component")...)`. The registry (`src/modules/forms/builder/registry.ts`) is unchanged as the single source of truth. `SidebarNodeProperties` wraps the rendered properties form in `Suspense`, and `BaseFormBlueprint` accepts either an eager component or a `LazyExoticComponent` via the shared `PropertiesComponent` type in `types/core.ts`.

Verification:

- `npx tsc --noEmit` passes.
- Full suite: `npm run test:run` — 173 files, 1431 tests passed.
- New `src/modules/forms/builder/__tests__/registry.test.tsx` asserts every `propertiesComponent` is lazy, `formComponent`/`designerComponent` stay eager, schemas and initial values resolve for every element, and the registry stays unified.
- Webpack bundle analyzer (`ANALYZE=true next build --webpack`): each properties component is now its own async chunk (e.g. `7502.*` for Paragraph, `5643.*` for Checkbox), and the form-runner registry chunk `86261` no longer contains `@tiptap/react`; it only carries the static renderer.

Remaining verification:

- The initial public page HTML still lists the standalone `@tiptap/react` chunk because other eager paths in the `(home)` graph pull it in (admin editor barrels `31041`/`34822` and the Puck render config). This is outside the form-runner seam and belongs to the critical-assets / prefetch phases (issues 03–04). The bundle checkbox stays open until those are addressed.
- No Lighthouse run was captured in this environment; compare mobile/desktop before and after per the spec's testing decisions.

Decision record: `docs/adr/0027-lazy-load-form-properties.md`. Domain terms added to `CONTEXT.md`.
