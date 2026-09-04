# 01: Rendere affidabile la Scheduled publication dei Post

**What to build:** rendere affidabile il ciclo completo di Scheduled publication dei Post prima di introdurre il nuovo scheduler comune. Un editor deve poter schedulare, modificare, annullare, riprogrammare e pubblicare immediatamente un Post senza creare stati incoerenti o schedulazioni concorrenti.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] La Scheduled publication valida lato server tutti i campi necessari alla pubblicazione, non soltanto quelli controllati dall’interfaccia.
- [x] Una data nel passato o non valida viene rifiutata dal livello applicativo.
- [x] È possibile schedulare soltanto la versione corrente ed eleggibile del Post.
- [x] Esiste al massimo una Scheduled publication attiva per ogni Post root, anche in presenza di richieste concorrenti.
- [x] Modificare un Post schedulato aggiorna la versione futura esistente invece di crearne una concorrente.
- [x] Annullare la Scheduled publication ripristina lo stato editoriale precedente corretto.
- [x] Pubblicare immediatamente un Post schedulato impedisce una successiva pubblicazione automatica duplicata.
- [x] La versione pubblica corrente rimane invariata fino alla pubblicazione riuscita della versione schedulata.
- [x] Il workflow esistente di pubblicazione manuale continua a funzionare per Post validi `DRAFT` e `CHANGED`.
- [x] Sono presenti test di integrazione sulle transizioni, sulle invarianti del Post e sulle richieste concorrenti.
- [x] I test verificano il comportamento osservabile e non i dettagli interni delle query o dei lock.

## Comments

Implemented by making the scheduled-publication lifecycle transactional and re-validating state at every entry point:

- Added root-level `SELECT ... FOR UPDATE` locking (`lock-root-posts.ts`) around `schedulePost`, `reschedulePost`, `cancelSchedule`, and `publishPost` to prevent concurrent scheduling/publishing races.
- `schedulePost` now validates `title` and `slug`, rejects invalid/past dates, and allows scheduling only the current (highest-version) eligible post.
- `publishPost` gains a `mode: 'scheduled'` option used by `publishDuePosts`; in scheduled mode it re-checks that the post is still `SCHEDULED` and its `scheduledAt` is due, closing the race where a post is cancelled/rescheduled after the due-post query selects it.
- The `posts.create` tRPC procedure now records `preSchedulingStatus: DRAFT` when creating a scheduled post, so cancellation restores a consistent state.
- Added/extended integration tests covering invalid dates, missing publication fields, non-current versions, concurrent scheduling, scheduled-mode publication invariants, and public-version stability.
