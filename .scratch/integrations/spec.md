# External Integrations

**Status:** `ready-for-agent`

## Problem Statement

Oggi le credenziali dei servizi esterni vivono quasi tutte in variabili d'ambiente. Per Resend questo significa che cambiare API key o webhook secret richiede di modificare `.env` e rifare il deploy; la chiave API vive in `NEXT_RESEND_KEY`, il webhook secret in `NEXT_RESEND_WEBHOOK_SECRET`, e il codice le legge direttamente. L'admin non ha alcun modo di vedere lo stato di una connessione, provarla, o sostituire una chiave.

La situazione è incoerente: le email hanno `EmailSetting.emailApiKey` in chiaro nel database (usata dal percorso SendGrid legacy), le automazioni hanno `Credential` cifrato e completamente scollegato, e Stripe, UploadThing, reCAPTCHA e GTM leggono solo env. Non esiste un posto unico dove un admin risponda alla domanda "questo sito è collegato a cosa, e funziona?".

Il problema è destinato a crescere: ogni nuovo servizio esterno aggiunge un'altra variabile d'ambiente e un altro percorso di lettura ad hoc.

## Solution

Introdurre una feature **Integrations**: una riga per ogni servizio esterno configurato, con credenziali cifrate a riposo, stato abilitato/disabilitato, configurazione non segreta e test di connessione.

La v1 copre **solo Resend**, perché è il caso già completamente cablato e perché il modulo email è il motore del bisogno. Il modello è però progettato per accogliere gli altri provider uno alla volta. **La riga `Integration` è l'unica fonte delle credenziali**: non esiste fallback alle variabili d'ambiente e non esiste un'azione di importazione dall'ambiente. Un'installazione senza riga è "non configurata" e fallisce in modo esplicito finché l'admin non incolla le credenziali dal backoffice.

Il risultato per l'admin: una pagina Integrations in cui vede Resend, il suo stato, l'ultimo test, e può sostituire le chiavi senza toccare il deploy. Il risultato per lo sviluppatore: un unico punto di risoluzione delle credenziali, con semantica esplicita per "non configurato", "disabilitato" e "incompleto".

## User Stories

1. As an admin, I want to see the external services the site is configured with, so that I know what the CMS depends on.
2. As an admin, I want to configure Resend from the backoffice, so that I don't need access to environment variables or a deploy.
3. As an admin, I want to replace the Resend API key without redeploying, so that rotation is immediate.
4. As an admin, I want to replace the Resend webhook secret without redeploying, so that inbound email can be restored quickly.
5. As an admin, I want secrets never to be shown again after saving, so that a compromised backoffice session cannot exfiltrate them.
6. As an admin, I want a blank secret field on edit to keep the current secret, so that I can change non-secret settings without retyping keys.
7. As an admin, I want to test the Resend connection on demand, so that I can verify a key before relying on it.
8. As an admin, I want to see when the connection was last tested and whether it succeeded, so that I can distinguish "never tried" from "tried and broken".
9. As an admin, I want to disable Resend explicitly, so that outgoing email stops until it is re-enabled.
10. As an admin, I want to be told explicitly when a provider is not configured, so that I know what to fix before email silently stops.
11. As an admin, I want outbound email to keep working even when the webhook secret is absent, so that a missing inbound configuration doesn't break sending.
12. As an admin, I want the inbound webhook to report a clear "not configured" state, so that I can understand why received email stopped.
13. As an admin, I want integration changes to be audited, so that I can see who changed a connection and when, without exposing secret values.
14. As an admin with read-only access, I want to view integrations without being able to change them, so that permissions remain meaningful.
15. As a developer, I want a single server-only resolver that returns decrypted credentials for a provider, so that no feature reads environment variables directly.
16. As a developer, I want the resolver to report an explicit "not configured" state when no integration row exists, so that there is a single source of truth for credentials.
17. As a developer, I want a disabled integration to fail loudly instead of falling back, so that "disabled" means disabled.
18. As a developer, I want provider-specific metadata and test logic to live behind a provider descriptor, so that adding a provider doesn't touch the generic integration CRUD.
19. As a developer, I want the existing encrypted Credential store and the new integration secrets to share one encryption implementation, so that there is one crypto path to review and rotate.
20. As a developer, I want the emails module to receive credentials by injection instead of reading the environment, so that its adapters stay testable.
21. As an operator, I want a documented, explicit set of environment variables that remain bootstrap-only, so that "remove the env" has a bounded meaning.
22. As an operator, I want integration reads not to be cached across requests in v1, so that a saved key takes effect immediately.
23. As a security reviewer, I want decrypted integration secrets to be reachable only from server-only code, so that no tRPC read path can return them.
24. As a security reviewer, I want audit entries to contain no secret material, so that the activity log is safe to browse.
25. As a future maintainer, I want the provider key to be a validated string rather than a Prisma enum, so that adding a provider is a code change, not a database migration.

## Implementation Decisions

### 1. Modello `Integration`

Una riga per provider, globale per installazione (nessun `siteId` in v1):

- `provider`: stringa unica, validata dal registry applicativo (non enum Prisma).
- `isEnabled`: boolean, default `false`.
- `config`: JSON tipizzato, per i dati non segreti specifici del provider. Per Resend è vuoto in v1.
- `secretEncrypted`: stringa cifrata contenente un oggetto JSON con i segreti del provider. Per Resend: `{ apiKey, webhookSecret? }`.
- `lastTestedAt`: timestamp nullable.
- `lastTestStatus`: `ok` / `failed`, nullable.
- timestamp standard.

Nessun campo `name`: con una riga per provider sarebbe ridondante. Nessun `updatedBy`: l'audit vive in `AdministrativeActivity`.

### 2. Cifratura condivisa

L'implementazione esistente delle automazioni viene estratta in una utility condivisa, server-only. Il formato `enc:v1:` resta invariato per compatibilità.

La chiave viene letta da `SECRETS_ENCRYPTION_KEY`, con fallback a `AUTOMATION_CREDENTIALS_KEY` per le righe `Credential` già esistenti. Nessuna rotazione delle chiavi in v1; il prefisso di versione lascia spazio a uno schema futuro.

`Credential` resta l'entità dei segreti arbitrari referenziati dai nodi di automazione. Non viene unificata con `Integration`: un nodo HTTP può aver bisogno di un bearer token che non corrisponde a nessun provider noto.

### 3. Semantica di risoluzione

Il resolver server-only per provider distingue tre stati:

- **Nessuna riga**: stato "non configurato". Errore esplicito che nomina il provider; nessun fallback alle variabili d'ambiente.
- **Riga disabilitata**: errore esplicito. Nessun fallback silenzioso.
- **Riga abilitata ma incompleta**: errore esplicito che nomina il campo mancante. Per Resend l'API key è obbligatoria; il webhook secret è opzionale.

Il webhook secret opzionale non blocca l'outbound. L'endpoint inbound risponde con uno stato "not configured" dedicato quando il segreto manca, invece dell'errore generico attuale.

### 4. Provider descriptor

Ogni provider è descritto da un descriptor che espone:

- la chiave del provider e i campi accettati;
- lo schema di validazione dei campi segreti;
- il test di connessione.

Per Resend il test usa la lista dei domini (operazione read-only) e riporta i domini verificati. Il descriptor Resend non importa nulla dal modulo email; il modulo email importa solo il resolver delle credenziali.

Il registry dei descriptor non è generico oltre il necessario: la v1 ha un solo provider. La forma è quella che permette di aggiungerne un secondo senza toccare il CRUD.

### 5. Emails

`EmailSetting.emailProvider` resta il selettore del provider in v1. `EmailSetting` continua a possedere identità del mittente, cap giornaliero e template. La API key smette di essere letta da `EmailSetting` e viene risolta dall'integrazione.

L'adapter Resend riceve la API key nel costruttore. La risoluzione dell'adapter legge il provider da `EmailSetting`, poi chiede le credenziali al resolver delle integrazioni. Il percorso legacy che richiedeva la presenza di `EmailSetting.emailApiKey` viene corretto: non deve più condizionare l'invio.

La lettura di una credenziale da un componente client viene rimossa; le chiavi non compaiono mai nel bundle client.

### 6. UI e permessi

Pagina Integrations **di primo livello** (`/admin/integrations`), separata da Settings nella sidebar, con una card per provider disposte in griglia. Per Resend mostra: logo del provider, stato abilitato, presenza delle credenziali, ultimo test, campi segreti write-only, azione di test e un dialog di dettaglio che ospita la guida di configurazione del provider (spostata dalle impostazioni email al selettore della singola integrazione).

I segreti non sono mai restituiti dalle procedure di lettura. Il campo vuoto in modifica mantiene il valore corrente. Non esiste un endpoint di reveal.

Permessi dedicati `integrations.read` e `integrations.manage`; le azioni di gestione nella UI sono nascoste agli utenti in sola lettura.

### 7. Audit

Create, update, enable/disable e test producono una voce in `AdministrativeActivity`. Il payload è sanificato: nessun valore di segreto, nemmeno cifrato. La allowlist del sanitizer va estesa per i campi non segreti dell'integrazione, oppure il payload viene costruito già ristretto.

### 8. Cache

Nessuna cache cross-request in v1. La risoluzione può usare memoizzazione per-request, ma un salvataggio deve avere effetto immediato. Una lookup su indice unico è trascurabile rispetto a una chiamata al provider.

### 9. Confine delle dipendenze

`integrations` non importa nulla da `mails`. La direzione è `mails → integrations`. Le credenziali escono dal resolver già decifrate, solo verso codice server-only.

### 10. Variabili d'ambiente residue

Restano bootstrap-only le variabili d'infrastruttura: database, auth, chiave di cifratura, secret dello scheduler e le variabili `NEXT_PUBLIC_*` (bundlate a build time). Le credenziali dei provider **non sono mai** lette dall'ambiente: `NEXT_RESEND_KEY` e `NEXT_RESEND_WEBHOOK_SECRET` sono rimosse dal percorso runtime e l'unica via è la riga `Integration`. La rotazione avviene solo dal backoffice.

## Security Decisions

### 11. Formato di cifratura con key identifier

Il formato condiviso diventa `enc:v1:<keyId>:<base64Payload>`, dove `<keyId>` è un identificatore stabile della chiave usata (es. hash SHA-256 troncata della chiave o identificatore gestito). Questo permette:

- rotazione controllata delle chiavi;
- coesistenza di righe cifrate con `SECRETS_ENCRYPTION_KEY` e righe legacy cifrate con `AUTOMATION_CREDENTIALS_KEY`;
- fail esplicito quando una riga richiede una chiave non disponibile.

Le righe `Credential` esistenti senza `<keyId>` restano leggibili tramite un path legacy che prova la chiave `AUTOMATION_CREDENTIALS_KEY`; le nuove righe `Integration` devono sempre contenere il `<keyId>`.

### 12. Fail esplicito della decrittazione

Il decrypt delle integrazioni non deve mai restituire il ciphertext in chiaro quando il formato è invalido, manca il prefisso o il tag è corrotto. Un'eccezione esplicita viene lanciata e mappata a un errore operativo. Questo comportamento si applica solo alle integrazioni; il path legacy di `Credential` mantiene il fallback per compatibilità.

### 13. Qualità della chiave di cifratura

`SECRETS_ENCRYPTION_KEY` deve essere una stringa casuale di almeno 32 byte (es. generata con `openssl rand -base64 32` o equivalente). Non deve essere una passphrase umana. La chiave viene derivata con SHA-256 solo per ottenere 256 bit; la sicurezza dipende quindi dall'entropia iniziale.

### 14. Migrazione dei permessi

I nuovi permessi `integrations.read` e `integrations.manage` non sono sufficienti a garantire l'accesso agli admin esistenti, perché i permessi sono legati ai ruoli nel database. Una migration Prisma SQL (o un seed condizionale) assegna entrambi i permessi ai ruoli system che già possiedono `settings.update` o `email-settings.manage`.

### 15. Costruzione manuale del payload di audit

Le voci `AdministrativeActivity` per le integrazioni vengono costruite con un payload ristretto e mai passate al sanitizer generico. I campi ammessi in `before`/`after` sono: `provider`, `isEnabled`, `config`, `lastTestedAt`, `lastTestStatus`, `outcome`. `secretEncrypted`, `apiKey`, `webhookSecret` e qualsiasi derivato non compaiono mai.

### 16. Validazione del timestamp sul webhook inbound

L'endpoint `/api/webhooks/resend` valida l'header `svix-timestamp` prima o durante la verifica della firma, rifiutando eventi al di fuori di una finestra temporale ragionevole (es. ±5 minuti). Questo mitiga gli attacchi di replay di payload validi.

### 17. Rate limiting del test di connessione

L'azione di test di connessione è protetta da rate limiting lato server (es. una chiamata per provider ogni pochi secondi) per evitare abuse verso l'API Resend. Il test non viene eseguito automaticamente al salvataggio.

### 18. Semantica esplicita di update dei segreti

Il payload di update distingue tra:

- assenza del campo → mantieni il segreto corrente;
- `null` → rimuovi il segreto (utile per `webhookSecret`);
- stringa non vuota → sostituisci il segreto.

Questo evita sia la cancellazione accidentale sia l'impossibilità di rimuovere un segreto opzionale.

## Testing Decisions

### Cosa rende un buon test

I test verificano comportamento esterno, non dettagli implementativi: quale credenziale viene risolta in ciascuno stato, quale errore viene prodotto, quali valori il client non riceve mai, quale risposta HTTP esce dal webhook, quale stato resta nel database dopo un'operazione. Non testano la forma interna degli helper né il numero di query.

### Seam 1 — Risoluzione dell'adapter email

Il seam più alto è la risoluzione dell'adapter usata dal modulo email. Copre: nessuna riga → stato "non configurato"; riga abilitata → credenziale dal database; riga disabilitata → errore; riga incompleta → errore; adapter costruito con la chiave risolta.

Prior art: i test esistenti dell'adapter Resend e i test del modulo email.

### Seam 2 — Router tRPC delle integrazioni

Router DB-backed, nello stile dei router esistenti: update non restituisce segreti; campo vuoto mantiene il segreto; enable/disable; test di connessione mappa successo e fallimento; audit senza segreti.

Prior art: i test dei router di categoria e degli account email.

### Seam 3 — Webhook Resend

La route inbound: webhook secret assente → stato "not configured"; firma invalida → 400; evento non rilevante → 200 ignorato; evento valido → 200. La verifica della firma usa il segreto risolto dall'integrazione.

Prior art: il test esistente della route webhook.

### Non testati direttamente

La UI admin (componenti sottili) e il descriptor oltre al suo comportamento osservabile tramite il router. Il crypto condiviso mantiene il test di round-trip esistente, esteso al fallback della vecchia chiave.

## Out of Scope

- UploadThing, GTM/GA, Stripe, reCAPTCHA e qualunque provider diverso da Resend.
- Rimozione fisica della colonna `EmailSetting.emailApiKey` (percorso SendGrid legacy): fase successiva.
- Importazione automatica delle credenziali dalle variabili d'ambiente: deliberatamente non supportata (vedi ADR 0023).
- Spostamento del selettore `emailProvider` da `EmailSetting` a `Integration`: ha senso con un secondo provider email.
- Rifacimento del percorso SendGrid legacy.
- Rotazione e re-encryption delle chiavi.
- Multi-tenant / più installazioni nella stessa base dati.
- Cache cross-request delle credenziali.
- Endpoint di reveal dei segreti.
- Invio di una email di prova come test di connessione: il test è read-only.

## Further Notes

- La decisione "la riga `Integration` è l'unica fonte delle credenziali" (e il rifiuto deliberato di un fallback env e dell'import dall'ambiente) è registrata nell'ADR 0023: `docs/adr/0023-integration-is-the-only-credential-source.md`.
- Una checklist di sicurezza pre-merge è disponibile in `security-review.md`; deve essere completata prima di chiudere l'ultimo ticket.
- La procedura di migrazione manuale per le installazioni che usavano solo le env è in `docs/integrations-runbook.md`.
- Il glossario in `CONTEXT.md` è già stato esteso con **Provider** e **Integration**; `Connection` resta riservato alle automazioni.
- Il bug latente per cui l'invio Resend richiedeva la presenza di `EmailSetting.emailApiKey` ma usava l'env va risolto in questa feature, non lasciato come debito.
- La feature è pensata per essere estesa un provider alla volta: ogni nuovo provider è la prova che il descriptor e lo schema dei segreti reggono.
