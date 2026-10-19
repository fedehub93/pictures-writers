# Integrations — Security review checklist

Questo documento raccoglie i controlli di sicurezza da eseguire prima di considerare completata la feature Integrations. Deriva dall'analisi di sicurezza effettuata prima dell'implementazione e riflette le decisioni aggiuntive introdotte in `spec.md`.

## Crypto e segreti a riposo

- [ ] `Integration.secretEncrypted` usa il formato `enc:v1:<keyId>:<base64Payload>`.
- [ ] Il `<keyId>` permette di selezionare tra `SECRETS_ENCRYPTION_KEY` e `AUTOMATION_CREDENTIALS_KEY` senza tentativi a cascata.
- [ ] `SECRETS_ENCRYPTION_KEY` è documentata come chiave casuale di almeno 32 byte.
- [ ] Il decrypt delle integrazioni fallisce esplicitamente su prefisso mancante, ciphertext troppo corto o tag GCM invalido; non restituisce mai il ciphertext in chiaro.
- [ ] Il path legacy per `Credential` mantiene la compatibilità con righe senza `<keyId>`.
- [ ] La chiave di cifratura non compare in log, stack trace o risposte API.

## Risoluzione credenziali

- [ ] Il resolver Integration è marcato `import "server-only"`.
- [ ] Nessun codice client (componenti React, browser, bundle) può leggere, pre-fetchare o ricevere segreti.
- [ ] Nessuna cache cross-request: una modifica salvata ha effetto immediatamente nella richiesta successiva.
- [ ] Stati del resolver:
  - nessuna riga → stato "non configurato", nessun fallback alle env;
  - riga disabilitata → errore esplicito, nessun fallback;
  - riga abilitata ma senza API key → errore che nomina il campo mancante;
  - riga abilitata con API key → chiave dal database.
- [ ] Il webhook secret opzionale non blocca l'outbound.

## Modulo email

- [ ] `ResendAdapter` accetta `apiKey` nel costruttore e non legge `process.env`.
- [ ] `sendResendEmail` in `src/modules/mails/lib/mail.ts` non crea più `new Resend(process.env.NEXT_RESEND_KEY)`.
- [ ] Tutti gli invii Resend passano per `resolveAdapter()` o equivalente.
- [ ] L'invio non richiede più `EmailSetting.emailApiKey`.

## API e permessi

- [ ] Esistono `PERMISSIONS.INTEGRATIONS_READ` e `PERMISSIONS.INTEGRATIONS_MANAGE`.
- [ ] I ruoli system esistenti (in particolare `ADMIN`) ricevono i nuovi permessi tramite migration Prisma SQL o seed condizionale.
- [ ] Tutte le procedure del router integrations usano `permissionProcedure`.
- [ ] Non esiste alcuna procedure `reveal`, `decrypt` o simile.
- [ ] Le query restituiscono solo: `provider`, `isEnabled`, `config`, `lastTestedAt`, `lastTestStatus`.
- [ ] `secretEncrypted` non è mai selezionato nelle risposte tRPC.

## UI admin

- [ ] I campi segreto sono renderizzati come `<input type="password">`.
- [ ] I campi non sono pre-popolati con il valore corrente.
- [ ] La modifica distingue: assenza = mantieni, `null` = rimuovi, stringa non vuota = sostituisci.
- [ ] È presente un'azione esplicita per rimuovere il webhook secret opzionale.
- [ ] La pagina è protetta da `requirePermission(PERMISSIONS.INTEGRATIONS_READ)` o equivalente.

## Audit

- [ ] Ogni create/update/enable/disable/test produce una voce in `AdministrativeActivity`.
- [ ] Il payload `before`/`after` è costruito manualmente con solo: `provider`, `isEnabled`, `config`, `lastTestedAt`, `lastTestStatus`, `outcome`.
- [ ] `secretEncrypted`, `apiKey`, `webhookSecret` e valori derivati non compaiono mai nei log.
- [ ] I test verificano che audit rows non contengano segreti.

## Test di connessione

- [ ] Il test usa un'operazione read-only di Resend (es. `domains.list()`).
- [ ] Il test è rate-limited lato server per provider.
- [ ] Il test non viene eseguito automaticamente al salvataggio.
- [ ] Risultati successo/fallimento aggiornano `lastTestedAt` e `lastTestStatus`.

## Webhook inbound

- [ ] Il webhook secret viene letto dal resolver Integration, non da `process.env`.
- [ ] Se il secret manca, l'endpoint restituisce HTTP 200 con body `{ status: "not_configured" }`.
- [ ] Se la firma è invalida, restituisce HTTP 400.
- [ ] Se l'evento non è `email.received`, restituisce HTTP 200 `{ status: "ignored" }`.
- [ ] L'header `svix-timestamp` è validato entro ±5 minuti.
- [ ] La verifica della firma è eseguita dal SDK Resend/Svix in modo constant-time.

## Variabili d'ambiente e operazioni

- [ ] `NEXT_RESEND_KEY` e `NEXT_RESEND_WEBHOOK_SECRET` non sono lette da nessun percorso runtime.
- [ ] `SECRETS_ENCRYPTION_KEY` è classificata bootstrap-only.
- [ ] Il backup del DB senza `SECRETS_ENCRYPTION_KEY` non permette di recuperare i segreti: questo è documentato nella runbook.
- [ ] La runbook (`docs/integrations-runbook.md`) descrive la migrazione manuale per le installazioni che usavano solo le env.

## Test da aggiungere/rinforzare

- [ ] Round-trip cifratura con `keyId` e selezione corretta della chiave.
- [ ] Decrypt fallisce su ciphertext malformato per Integration.
- [ ] Compatibilità righe `Credential` legacy senza `keyId`.
- [ ] Nessuna riga → stato "non configurato"; riga abilitata → DB; riga disabilitata → errore; riga incompleta → errore.
- [ ] Adapter costruito con chiave iniettata; nessuna lettura di `process.env`.
- [ ] tRPC read non restituisce segreti.
- [ ] Update con `null` rimuove il segreto; update senza campo mantiene il segreto.
- [ ] Audit senza segreti.
- [ ] Webhook: not-configured, firma invalida, timestamp scaduto, evento ignorato, evento accettato.
- [ ] Rate limiting del test di connessione.

## Decisioni da registrare come ADR (opzionale)

- **Registrata in ADR 0023**: la riga `Integration` è l'unica fonte delle credenziali; niente fallback alle env, niente import dall'ambiente.
- Formato cifratura con `keyId` per supportare rotazione e chiavi legacy.
- Entità `Integration` separata da `Credential`.
- Webhook secret opzionale con risposta "not configured".

---

**Uso:** barrare ogni voce durante la code review finale e prima del merge. Eventuali voci non barrate devono essere accompagnate da un ticket o da una decisione documentata.
