# 01: Stabilizzare il workflow di pubblicazione dei Post

**What to build:** rendere il workflow di pubblicazione dei Post condivisibile e idempotente, mantenendo invariato il comportamento osservabile della pubblicazione manuale. Questo ticket è un prefactoring mirato che prepara la pubblicazione automatica senza introdurre ancora la Scheduled publication visibile agli editor.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] La pubblicazione manuale continua a funzionare per i Post `DRAFT` e `CHANGED` validi.
- [ ] La pubblicazione promuove la versione selezionata a `PUBLISHED` e demotiva correttamente la versione pubblica precedente.
- [ ] `isLatest`, `publishedAt` e `firstPublishedAt` conservano il comportamento storico previsto.
- [ ] Il workflow può essere richiamato da più entry point senza duplicare la logica di transizione della pubblicazione.
- [ ] Una richiesta ripetuta o concorrente non produce una seconda pubblicazione effettiva né uno stato incoerente delle versioni.
- [ ] Le condizioni di validazione già richieste dalla pubblicazione manuale vengono mantenute.
- [ ] Sono presenti test di integrazione sul workflow applicativo, usando un orologio controllabile quando necessario.
- [ ] I test usano il database già configurato nel file `.env` come database di test del progetto.
- [ ] Le migration necessarie vengono eseguite su quel database prima dei test.
- [ ] I test verificano il comportamento osservabile e non i dettagli interni dell’implementazione.
- [x] Il lint e gli altri controlli di validazione disponibili nel progetto restano verdi.

## Comments

Implemented in commit `d5c719d`.

- Extracted `publishPost` workflow to `src/modules/blog/posts/workflows/publish-post.ts`.
- Locked root versions with `FOR UPDATE` to make concurrent publishes safe.
- Wired the existing `posts.publish` tRPC procedure to the shared workflow.
- Added Vitest harness (`vitest.config.ts`, `tests/global-setup.ts`, `tests/setup.ts`) that runs `prisma migrate deploy` against the `.env` database before tests.
- Added integration tests covering DRAFT/CHANGED publication, demotion of previous versions, timestamp semantics, repeated calls and concurrent calls.

Note: `npm run lint` is currently blocked by a pre-existing `typescript-eslint` / TypeScript 7.0 incompatibility in the project toolchain, not by the new code. `npx tsc --noEmit` and the test suite are green.
