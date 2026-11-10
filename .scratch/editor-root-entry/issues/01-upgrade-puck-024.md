---
Status: done
Type: task
---

# Upgrade `@puckeditor/core` to 0.24

## Goal

Move the Puck dependency from `^0.23.0` to `^0.24.0` in an isolated commit, so the editor-root entry point is built on the current release and any regression from the upgrade is bisectable on its own.

## Acceptance criteria

- [x] `package.json` declares `"@puckeditor/core": "^0.24.0"` and `package-lock.json` is updated by the install, with no other dependency moved.
- [x] The editor stylesheet import still resolves: `@puckeditor/core/puck.css` (or the 0.24 replacement path, if the export changed).
- [x] No source change is needed for the upgrade. In particular the project has no `overrides.fields` implementation and no `React.Children` traversal of field nodes, so the 0.24 migration note does not apply.
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run test:run` and `npm run build` pass. `tsc`, `test:run` and `build` pass; `lint` fails on 40 pre-existing errors, none in a file this commit touches — see Comments.
- [x] Manual smoke test: the page editor, the Header region editor and the Footer region editor each load, the canvas renders the document, a block can be selected and edited, the outline works, the properties panel updates, preview mode toggles, and save/publish still round-trip a document.
- [x] Documents saved before the upgrade load unchanged; nothing in the saved payload shape changed.
- [x] This commit introduces no feature work: the editor-root entry points come in ticket 02.

## Implementation notes

- Install with `npm install @puckeditor/core@^0.24.0`; keep the rest of the lockfile untouched.
- Public surface used by the project and expected to be stable: `Puck`, `Puck.Fields`, `Puck.Outline`, `Puck.Preview`, `Puck.Layout`, `Render`, `Drawer`, `createUsePuck`, `Config`, `Data`, `Metadata`, `RootConfig`, `PuckContext`, `PuckAction`.
- 0.24 wraps each field in a group item and adds `FieldTab`/`FieldGroup`; the project uses neither. The only behaviour change that could surface is visual (field spacing inside the panel), which the smoke test covers.
- No Prisma, tRPC, deployment or environment change is involved.

## Verification

- Commands above, plus the manual smoke test on the three editors.
- If anything unexpected appears, record it in `## Comments` before deciding whether to pin `0.23.x` and postpone.

## Out of scope

- Adopting field groups, field tabs, the `checkbox` field, `dnd.enableDragHandle`, `InlineTextField`, `fieldTransforms` in `<Render>`, or the new `fields` override API.
- Any change to the editor UI, including the editor-root entries (ticket 02).

## Comments

- 2026-11-10 — Upgrade applied as an isolated commit. `npm ls @puckeditor/core` resolves a single `0.24.0`. The change is the `package.json` range plus, in the lockfile, the `node_modules/@puckeditor/core` entry and that package's own dependencies (`@tiptap/*` `^3.11.1` → `^3.30.4`, resolved to the already-installed `3.31.3`, and `happy-dom` `^20` → `^21`, installed nested because the root devDependency pins `happy-dom@20`). No other top-level dependency moved.
- Stylesheet: 0.24 still exports `./puck.css` → `./dist/index.css`. No import changed.
- Public surface checked against `node_modules/@puckeditor/core/dist/index.d.ts`: `Puck.Fields`, `Puck.Layout`, `Puck.Outline`, `Puck.Preview`, `Drawer`, `createUsePuck`, `Config`, `Data`, `Metadata`, `RootConfig`, `Context`/`PuckContext`, `PuckAction` all still exported. `npx tsc --noEmit` is clean.
- No Puck `overrides` prop is passed anywhere under `src/` (the `overrides` identifiers that do exist there belong to the SEO helpers, not to Puck), and no source file references Puck's internal class names (`.Puck*`), so the 0.24 `fields`-override migration note and any field-markup change are inert here.
- `npm run test:run`: 241 files / 1982 tests pass. `npm run build` succeeds — Next reports `Generating static pages (382/382)` and writes 312 HTML files. Saved documents are untouched: no schema or payload change, and the render and editor tests built on pre-existing fixtures stay green.
- **`npm run lint` does not pass, and did not pass before this commit.** It reports 40 errors in files untouched here (`src/app/api/admin/ads/...`, `src/modules/forms/builder/**`, `src/modules/shop/products/**`, `src/modules/mails/**`, `src/shared/**`). CI does not gate on lint (`.github/workflows/test.yml` runs only `npm run test:run`). Fixing them would break the "isolated commit, no other work" rule, so they were left alone.
- Local-only pitfall hit while verifying, recorded so it is not mistaken for a regression: on this Windows machine the Docker Desktop port forwarder for the dev database (`localhost:5434`) black-holes IPv6. `localhost` resolves to `::1` first, the proxy accepts the TCP handshake and never forwards it, and Prisma has no connect timeout (`src/shared/lib/db.ts`), so `next build` hangs at "Collecting page data" with zero CPU and no Postgres backends. `127.0.0.1:5434` works, and the test database (`5433`) is unaffected. The build above was verified with `DATABASE_URL` pointing at `127.0.0.1`. This is machine state, not a repo change; the fix is a Docker Desktop restart or pointing the local `.env` at `127.0.0.1`.
- Status moved to `ready-for-human` for the browser smoke test on the three editors, which also covered loading a document written by 0.23; those two were the criteria left.
- 2026-11-10 — Smoke test done by the maintainer against the restored development database: the page editor, the Header region editor and the Footer region editor all load, blocks select, edit and reorder, the outline, the properties panel and preview mode behave as before, save/publish round-trip, and documents written before the upgrade open unchanged. Nothing regressed, so the upgrade stays at `^0.24.0`. Ticket closed; the editor-root entry points continue in ticket 02. The only box left unticked is the repo-wide `lint` failure recorded above, accepted as pre-existing and outside this commit.
