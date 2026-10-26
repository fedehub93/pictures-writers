# Zod Mini for public client forms

Public routes still paid for the full classic Zod package even after issue 02 unified public validation on Zod. Turbopack cannot shake the classic entry point's locale re-export, so every route that imported `zod` downloaded all locale modules. The analyzer measured 131 KiB of compressed Zod client code on `/`, `/shop/*`, and `/sign-in`, of which 72.7 KiB was locale data.

We migrated the client-side schemas used by public forms to `zod/mini`:

- Public schemas in `src/schemas/index.ts` (email, newsletter, free download, contact).
- The legacy dynamic form runner's generated schemas.
- The form builder runtime schemas and their `react-hook-form` resolver types.
- The sign-in form schema.

The public review views were also imported through `src/modules/reviews/index.ts`, whose admin exports pulled the admin reviews views and review schema into the home route. The barrel now exposes only public review components, and the admin reviews page imports its views directly. This removed the remaining classic Zod dependency from `/` without migrating admin schemas.

Zod Mini uses the same core as classic Zod and implements the same Standard Schema interface. `@hookform/resolvers/zod` already supports Zod 4 Mini (the installed resolver ships a dedicated `zod-v4-mini` test suite), and `zod-mini-runtime.test.ts` verifies the installed combination maps Mini issues to react-hook-form field errors and asserts resolver type inference for a representative Mini schema.

Mini is not a drop-in replacement for every schema. Its object schemas are plain values without `.min()`, `.max()`, `.optional()`, `.default()`, `.refine()`, `.extend()`, or `.pick()` methods. Those operations become checks or standalone helpers: `z.minLength(...)`, `z.optional(...)`, `z._default(...)`, `z.refine(...)`, `z.extend(...)`, `z.pick(...)`. Schemas that rely on those methods in many call sites, such as the admin product schemas, are intentionally left on classic Zod. The form builder field schemas moved together because each field's `propertiesSchema` shares a module with its runtime `buildSchema`. The admin-only layout and display properties schemas stay on classic Zod, as do the other admin and server/tRPC schemas; mixing both packages is safe because they share `zod/v4/core`.

## Measured results

The Turbopack analyzer shows these compressed client JS deltas against `perf/bundle-budget.baseline.json`:

| Route | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `/` | 688.3 KiB | 439.1 KiB | -249.3 KiB (-36.2%) |
| `/sign-in` | 409.1 KiB | 306.3 KiB | -102.7 KiB (-25.1%) |
| `/shop` | 1.09 MiB | 1.08 MiB | -9.6 KiB (-0.9%) |
| `/blog/[slug]` | 348.9 KiB | 348.9 KiB | 0 |
| `/shop/checkout` | 343.8 KiB | 343.8 KiB | 0 |

`/` no longer includes classic Zod or any locale module; only Mini plus the shared core remains. `/sign-in` retains a small classic Zod slice from the auth client. `/shop/*` still includes classic Zod because admin shop schemas share its client chunk; removing that would require migrating the admin shop schemas and every consumer of their `.extend()`/`.pick()` chains, which is outside this spike.

## Considered options

- **Migrate public client schemas to Zod Mini (chosen)**: removes classic Zod and all locales from the public routes that use the forms while keeping the server/admin ecosystem on the mature classic API.
- **Keep classic Zod**: costs roughly 131 KiB compressed per affected public route, mostly unused locale data.
- **Migrate every schema in the repo**: larger blast radius across tRPC procedures and admin forms, with no additional public benefit once the public graph is clean.

## Consequences

- New public-facing schemas should use `zod/mini`; admin and server schemas can stay on `zod`.
- Mini needs explicit error messages where classic provided defaults; the public schemas keep their existing user-facing messages.
- Module barrels that mix public and admin components now need to be split or imported directly to keep admin code out of public chunks.
- Public form validation and react-hook-form integration are covered by `src/schemas/__tests__/public-forms.test.ts` and `src/modules/forms/builder/__tests__/zod-mini-runtime.test.ts`.
