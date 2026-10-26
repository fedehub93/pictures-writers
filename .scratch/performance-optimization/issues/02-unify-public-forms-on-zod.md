# 02: Unify public form validation on Zod

**What to build:** Replace Valibot with Zod in all public forms outside the form builder so the bundle ships one validation library instead of two.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Identify every public form in the home route that currently uses Valibot.
- [x] Rewrite schemas and resolver usage to use Zod.
- [x] Remove Valibot from those files and from the public bundle.
- [x] All affected forms still validate, display errors, and submit correctly.
- [x] Bundle analyzer no longer shows Valibot in the initial public chunks.

## Notes

Public forms migrated from Valibot to Zod:

- `src/app/(home)/_components/contact-us.tsx` (contact form)
- `src/shared/components/widget/newsletter.tsx` (newsletter)
- `src/shared/components/widget/product-pop.tsx` (free digital download popup)
- `src/shared/components/form-component/dynamic-form.tsx` (legacy dynamic form runner)

`src/schemas/index.ts` now exports `EmailSchema`, `SubscribeSchema`, `FreeDigitalDownloadSchema`, and `ContactSchema`; the three server actions consume the same schemas with `z.input` types.

`FreeDigitalDownloadSchema` stays a loose object so richer lead-magnet answers are still preserved in `FormSubmission.data`, and privacy consent stays a boolean input with a `true` refinement so existing checkbox defaults keep working.

The `valibot` direct dependency was removed from `package.json`. It remains only as an optional peer of `@hookform/resolvers` and a dev-only transitive of `@prisma/dev`, so it is not part of the client bundle.

Verification:

- `npx tsc --noEmit` passes.
- Full suite: `npm run test:run` — 174 files, 1442 tests passed.
- New `src/schemas/__tests__/public-forms.test.ts` covers email, newsletter, contact, and free-download validation, including consent and extra-answer passthrough.
- Webpack bundle analyzer (`ANALYZE=true next build --webpack`): `.next/analyze/client.html` and `.next/analyze/nodejs.html` contain no `valibot` entries.
