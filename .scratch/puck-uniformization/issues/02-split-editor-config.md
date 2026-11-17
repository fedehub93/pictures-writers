# 02: Split the editor config registry from the editor shell

**What to build:** One canonical editor config module holds the component registry, the saved and hydrated document types and the page palette, with no dependency on the Puck editor component, the custom editor shell or the editor CSS. The Puck editor shell moves to its own module and consumes that registry. The obsolete duplicate config is deleted, and modules that only need types import them as type-only imports, removing the latent import cycle between the page header actions and the config.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Exactly one component registry and one set of saved/hydrated document types exist in the Puck layer.
- [x] The config module has no dependency on the Puck editor component, the custom editor shell or the editor CSS.
- [x] The editor shell module renders through the canonical registry and still supports an overridable header and a per-instance config.
- [x] The page header actions no longer form an import cycle with the config module.
- [x] The page builder and the Site region editor keep their external props and behaviour; type check, lint and tests pass.

## Implementation notes

- `src/puck/config.ts` is now the canonical editor config: `editorComponentConfigs` (the single component registry), `SavedComponents`/`HydratedComponents`, `PageEditorConfig`, the explicit `PAGE_COMPONENT_NAMES` page palette and the page `config`. It imports no `Puck` component, no editor shell and no `puck.css`.
- The page palette is derived from the registry with `pickComponentConfigs`, so a block definition changes once. The page categories stay explicit until ticket 03 derives them from the region palette tuples.
- `src/puck/editor-shell.tsx` owns the `Puck` wrapper, `puck.css`, viewports, custom editor shell and the client-only boundary. It defaults to the canonical page config and keeps the overridable `header` and per-instance `config` props unchanged.
- Deleted `src/puck/custom-config.tsx` and the obsolete `src/puck/config.tsx`. `PuckEditor` now imports from `@/puck/editor-shell`; the page builder and Site region editor were the only runtime callers.
- `HeaderActions` now imports `PageEditorConfig` with `import type`, which removes the runtime cycle through the editor shell. `pages/schemas.ts` also became type-only.
- Tests that referenced the deleted duplicate config (`render-pipeline.test.tsx`, `text-block.test.tsx`) now use the single page config.
- Verification: `npx tsc --noEmit`, targeted `eslint` (0 errors), `npm run test:run` (218 files / 1799 tests) and `npm run build` pass. Repository-wide `npm run lint` still reports the pre-existing errors noted in ticket 01.
