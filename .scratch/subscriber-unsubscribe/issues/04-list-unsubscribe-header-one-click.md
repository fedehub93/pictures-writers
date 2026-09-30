# 04: Header `List-Unsubscribe` (iniettati dalla policy) ed endpoint one-click

**What to build:** Il tipo email generico acquisisce `headers: Record<string, string>` e gli adapter del provider li inoltrano al canale transazionale — capacità generica, nessuna semantica di dominio. La policy di consegna del ticket 03 inietta sulla request gli header `List-Unsubscribe` e `List-Unsubscribe-Post: List-Unsubscribe=One-Click` quando il destinatario risolve a un Contact e `NEXT_PUBLIC_APP_URL` è configurata; se l'URL manca, gli header sono omessi senza errori (il footer del template resta funzionante). Una route pubblica interna revoca il consenso sul `POST` generato dal client (one-click) e risponde 2xx anche se la sincronizzazione col provider fallisce; un `GET` reindirizza alla pagina pubblica di conferma. Nodo e `sendAutomationEmail` restano generici: quest'ultimo si limita a inoltrare `headers` (ADR-0008).

**Blocked by:** 01 (revoca del consenso dietro un'unica funzione), 03 (policy di consegna)

**Status:** resolved

- [x] `GenericEmail` supporta `headers`; gli adapter provider li inoltrano al canale transazionale.
- [x] Contact + `NEXT_PUBLIC_APP_URL` configurata → header presenti, con URL `${NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe/?id=<contactId>`.
- [x] `NEXT_PUBLIC_APP_URL` assente → nessun header e nessun errore.
- [x] Destinatario non-Contact → nessun header.
- [x] Contact con consenso revocato → invio saltato dalla guardia di 03, nessun header.
- [x] `POST /api/newsletter/unsubscribe?id=<id>` revoca il consenso via `unsubscribeContactById` e risponde 2xx, anche se la sincronizzazione col provider fallisce.
- [x] `GET /api/newsletter/unsubscribe?id=<id>` reindirizza alla pagina pubblica di conferma.
- [x] Test: seam della policy (effetto interno iniettato) per presenza/assenza degli header; smoke della route (`POST` senza id → 400; `POST` con id valido → 2xx e consenso revocato; `GET` → redirect).

## Comments

Delivered:

- `GenericEmail` (`src/modules/mails/lib/types.ts`) acquisisce `headers?: Record<string, string>`; `sendSendgridEmail`/`sendResendEmail` (`src/modules/mails/lib/mail.ts`) inoltrano gli header al provider. `sendAutomationEmail` e l'effetto mail li propagano genericamente (nessun lookup di Contact, nessun `purpose`).
- `createSequenceDeliveryPolicy` inietta `List-Unsubscribe: <${NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe/?id=<contactId}>` e `List-Unsubscribe-Post: List-Unsubscribe=One-Click` quando il Contact esiste e l'URL è configurata (normalizzazione degli slash finali); URL assente → header omessi senza errore; consenso revocato → salto prima dell'iniezione.
- `src/app/api/newsletter/unsubscribe/route.ts`: `POST` (senza `id` → 400; altrimenti 204 dopo `unsubscribeContactById`, anche se la sync provider fallisce), `GET` → 303 redirect a `/rimuovi-sottoscrizione/?id=<id>`.
- Coverage: `sequence-delivery-policy.test.ts` (presenza/assenza header, normalizzazione URL, header preesistenti preservati), `mail-effect.test.ts` e `send-automation-email.test.ts` (passthrough header), `route.test.ts` (400 senza id; 2xx + consenso revocato su DB anche con sync provider fallita; 2xx per id inesistente; GET → redirect).
- Verified: suite completa verde (557/557), `npx tsc --noEmit` e eslint puliti.
