# 05: Remove env fallback and import-from-env

**What to build:** Rendere la riga `Integration` l'unica fonte delle credenziali Resend. Il resolver non consulta più le variabili d'ambiente: nessuna riga diventa lo stato esplicito "non configurato" (accanto a "disabilitato" e "incompleto"). L'azione `importFromEnv`, l'azione di audit `INTEGRATION_IMPORTED`, la voce di menu corrispondente e l'invalidazione della cache per-request vengono rimosse. `NEXT_RESEND_KEY` e `NEXT_RESEND_WEBHOOK_SECRET` escono dal percorso runtime; la migrazione per le installazioni che usavano solo le env è manuale (incollare le chiavi dal form).

**Blocked by:** None (can start immediately; costruisce sopra il lavoro già chiuso del ticket 02)

**Status:** done

## Risoluzione

- [x] Nessuna riga risolve in un errore esplicito "not configured" che nomina il provider; le variabili d'ambiente non vengono mai consultate.
- [x] `resolveResendSecrets` non legge più `NEXT_RESEND_KEY` né `NEXT_RESEND_WEBHOOK_SECRET`.
- [x] I messaggi di errore della risoluzione non menzionano più variabili d'ambiente.

## Rimozione di import-from-env

- [x] La mutation `importFromEnv` è rimossa dal router integrations.
- [x] L'azione di audit `INTEGRATION_IMPORTED` e i suoi usi sono rimossi.
- [x] `useImportIntegrationFromEnv` e la voce "Import from environment" nella card sono rimossi.
- [x] `invalidateCachedIntegrationSecrets` (e la sua esportazione) è rimossa perché senza più chiamanti; `resolution-cache.ts` mantiene solo la memoizzazione per-request.

## Test

- [x] I test di risoluzione sostituiscono i casi di fallback env con "nessuna riga → not configured"; nessun test imposta `NEXT_RESEND_KEY` / `NEXT_RESEND_WEBHOOK_SECRET`.
- [x] La suite `importFromEnv` del router è rimossa.
- [x] I test del modulo email non dipendono più da variabili d'ambiente per le credenziali Resend.

## Docs e operazioni

- [x] `spec.md` riflette la decisione a fonte unica (sezioni 3, 5, 6, 7, 10; la §19 sull'invalidazione dopo import è già stata rimossa).
- [x] `security-review.md` aggiornato (stati del resolver, azioni di audit, sezione env, elenco test).
- [x] ADR 0023 registra la decisione (`docs/adr/0023-integration-is-the-only-credential-source.md`).
- [x] `docs/integrations-runbook.md` documenta la migrazione manuale per le installazioni che usavano solo le env.
- [x] `AGENTS.md` non elenca più `NEXT_RESEND_KEY` / `NEXT_RESEND_WEBHOOK_SECRET` tra le variabili richieste.
- [x] I file `.env` / `.env.test` sono aggiornati dal proprietario del repository, non da questo ticket (eccezione: `.env.test` può essere toccato se serve ai test). `.env.test` non conteneva le variabili, quindi nessuna modifica necessaria.

## Blocking

Questo ticket **blocca 04**: il webhook non deve introdurre alcuna lettura del segreto dall'ambiente. Supera inoltre le parti di 03 relative a import-from-env e documentazione delle env residue.

## Comments

Implemented. The resolver now throws `Resend integration is not configured` when no row exists, and the environment is never consulted. `importFromEnv`, the `INTEGRATION_IMPORTED` audit action, the menu entry, and `invalidateCachedIntegrationSecrets` are removed. The webhook route (`src/app/api/webhooks/resend/route.ts`) still reads `process.env.NEXT_RESEND_WEBHOOK_SECRET`; moving it to the resolved integration belongs to ticket 04, which this ticket unblocks.

Full test suite: 1190 tests passing.
