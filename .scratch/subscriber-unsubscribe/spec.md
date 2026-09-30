# Subscriber unsubscribe — spec

Status: ready-for-agent

## Problem Statement

Le email di sequenza (nurture post-ebook, welcome newsletter, e in futuro post-acquisto) vengono inviate dal motore Automations tramite il nodo Send Email, che consegna con il canale transazionale del provider (non con i broadcast). Queste email:

- **non hanno un footer di disiscrizione** nel corpo, e il payload del trigger `form.submitted` non espone l'id del Contact, quindi un template Handlebars non può comporre il link di disiscrizione;
- **non impostano l'header `List-Unsubscribe`**, che i client di posta (Gmail, Apple Mail, Outlook) usano per mostrare il pulsante nativo "Annulla iscrizione";
- **non controllano il consenso prima dell'invio**: un Subscriber che ha revocato il consenso (unsubscribe) continua a ricevere le email della sequenza.

Conseguenza: chi si disiscrive non è davvero fuori dalle sequenze, con danno alla reputazione di invio (spam complaint, bounce) e un problema di conformità (GDPR / D.Lgs. 196/2003). I broadcast invece sono già sicuri, perché il provider gestisce disiscrizione e header da sé.

Vincolo di prodotto: l'applicativo è la **single-source-of-truth del consenso** e non si usa mai l'unsubscribe nativo del provider; la disiscrizione passa dal flusso interno esistente (pagina pubblica `/rimuovi-sottoscrizione`). Questo vale anche per le sequenze.

## Solution

Dare alle email di sequenza le stesse garanzie di disiscrizione dei broadcast, restando interamente interni all'app:

- **Footer authored nei template**: il template Handlebars compone il link di disiscrizione con l'id del Contact (es. `.../rimuovi-sottoscrizione/?id={{payload.contactId}}`). Perché funzioni, il payload del trigger `form.submitted` espone l'id del Contact (come già fa `subscription.confirmed`).
- **Tipo di email esplicito sul nodo**: il nodo Send Email dichiara un campo `purpose` (`marketing` | `transactional`, default `marketing`). È configurazione di dominio del modulo mails, non del motore (ADR-0005): il motore resta agnostico.
- **Header di posta (solo `marketing`)** impostati dal modulo mail al momento dell'invio: `List-Unsubscribe` e `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, puntati a un endpoint interno dell'app.
- **Guardia di consenso (solo `marketing`)**: per le email `marketing`, il modulo mail risolve il Contact dal destinatario; se il Contact esiste e il consenso è revocato (`isSubscriber = false`), l'invio viene **saltato** (nessuna email, Step non in errore). Per le email `transactional` non c'è guardia: l'invio avviene sempre.
- **Endpoint one-click interno**: una route pubblica che, sul `POST` generato dai client per il one-click, revoca il consenso con la stessa logica della pagina pubblica; un `GET` reindirizza alla pagina di conferma esistente.
- **Una sola logica di revoca**: sia la server action pubblica esistente, sia la nuova route one-click, delegano a un'unica funzione server di revoca del consenso, che **mantiene il Contact** (il consenso si revoca, non si cancella — vedi glossario).

## User Stories

1. Come Subscriber, voglio un link di disiscrizione in fondo a ogni email di sequenza, così posso revocare il consenso senza cercare una pagina nascosta.
2. Come Subscriber, voglio poter usare il pulsante nativo "Annulla iscrizione" del mio client di posta, così non devo aprire una pagina.
3. Come Subscriber che ha revocato il consenso, voglio **smettere di ricevere** le email della sequenza in corso, così il mio consenso revocato è rispettato.
4. Come Subscriber, voglio che la disiscrizione avvenga con un solo click dal client di posta, senza conferme aggiuntive, così è realmente immediata.
5. Come Subscriber, voglio continuare a esistere come Contact nel CRM dopo la disiscrizione, così posso riattivare il consenso in futuro senza ricreare il contatto.
6. Come admin, voglio che una email di sequenza venga **saltata** se il destinatario ha revocato il consenso, così non invio email indesiderate.
7. Come admin, voglio che il template della sequenza possa comporre il proprio footer di disiscrizione con l'id del Contact, così posso personalizzare testo e layout senza toccare il codice.
8. Come admin, voglio che l'id del Contact sia disponibile sia per il trigger `form.submitted` sia per `subscription.confirmed`, così il footer è identico nelle due sequenze.
9. Come admin, voglio che l'header `List-Unsubscribe` punti a un endpoint della **mia** applicazione e non a uno del provider, così l'app resta la single-source-of-truth del consenso.
10. Come admin, voglio che la route di disiscrizione risponda con successo anche se la sincronizzazione col provider fallisce, così il client di posta non segnala un errore all'utente.
11. Come admin, voglio che la revoca del consenso tramite route one-click abbia lo stesso effetto della pagina pubblica esistente, così non esistono due semantiché divergenti.
12. Come admin, voglio che se `NEXT_PUBLIC_APP_URL` non è configurata l'invio non si rompa e il footer continui a funzionare, così un errore di configurazione non blocca la sequenza.
13. Come sviluppatore, voglio una sola funzione server che revoca il consenso e sincronizza il provider, così la logica non è duplicata tra server action e route.
14. Come sviluppatore, voglio che il salto per consenso revocato non marchi lo Step come fallito, così la sequenza prosegue senza retry inutili.
15. Come sviluppatore, voglio che gli header passino attraverso il tipo email e gli adapter del provider, così il canale transazionale supporta gli stessi header del canale broadcast.
16. Come sviluppatore, voglio che il payload `form.submitted` porti `contactId` in modo opzionale, così i trigger che non hanno un Contact non si rompono.
17. Come sviluppatore, voglio testare il comportamento al confine del modulo di invio (transport iniettabile) e al confine della revoca (DB di test + adapter mockato), così non testo dettagli implementativi.
18. Come admin, voglio poter marcare un nodo Send Email come `transactional`, così le automazioni interne non applicano la guardia di consenso né l'header di disiscrizione.
19. Come admin, voglio che un nuovo nodo Send Email sia `marketing` di default, così non dimentico la conformità nelle sequenze.
20. Come admin, voglio vedere un selettore "Tipo di email" nel pannello del nodo, così scelgo consapevolmente tra marketing e transazionale.
21. Come sviluppatore, voglio che il tipo di email sia configurazione del nodo (modulo mails) e non del motore, così il motore resta domain-agnostic (ADR-0005).

## Implementation Decisions

### Moduli e interfacce modificati

- **Modulo mails — nodo Send Email**: nuovo campo di configurazione `purpose` (`marketing` | `transactional`), default `marketing` (anche quando assente, così i nodi esistenti restano marketing). Il pannello di configurazione del nodo espone un selettore "Tipo di email". Il motore non conosce il campo: lo passa al modulo mail come semplice configurazione.
- **Modulo mails — funzione di invio email di automazione** (`sendAutomationEmail`): comportamento in base a `purpose`. Se `marketing`: risolve il Contact dal destinatario; se il Contact esiste e il consenso è revocato, ritorna un esito di invio saltato (equivalente a `skipped`) senza contattare il provider e senza scrivere il log di invio; se il consenso è presente (o il destinatario non è un Contact), allega gli header `List-Unsubscribe` e `List-Unsubscribe-Post`. Se `transactional`: nessuna guardia e nessun header, invio semplice.
- **Modulo mails — tipo email generico** (`GenericEmail`): nuovo campo opzionale `headers: Record<string, string>`.
- **Modulo mails — adapter provider**: le funzioni di invio transazionale inoltrano `headers` al provider.
- **Modulo mails — nuova funzione server `unsubscribeContactById(id)`**: revoca il consenso (`isSubscriber = false`), **mantiene la riga Contact**, e tenta la sincronizzazione col provider in modalità best-effort (errori loggati, mai propagati). Ritorna `false` se il Contact non esiste. Idempotente: una seconda chiamata non produce errori.
- **Server action pubblica di disiscrizione**: diventa un thin wrapper che delega a `unsubscribeContactById`, mantenendo il contratto di ritorno (`{ error }` / `{ success }`).
- **Nuova route pubblica di disiscrizione**: `POST` con l'id del Contact come query string → revoca e risponde 2xx (obbligatorio per il one-click). `GET` → reindirizza alla pagina pubblica esistente di conferma.
- **Modulo forms — payload del trigger `form.submitted`**: nuovo campo opzionale `contactId`, valorizzato dall'emitter quando disponibile. Aggiornato anche il `defaultData` del catalogo (per l'autocomplete delle espressioni).

### Contratti e decisioni tecniche

- **URL di disiscrizione**: `${NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe/?id=<contactId>`, con `NEXT_PUBLIC_APP_URL` normalizzata (rimozione slash finali). Se l'URL non è configurata, gli header vengono omessi (il footer resta funzionante).
- **Contratto footer per l'autore del template**: l'id del Contact è disponibile come `{{payload.contactId}}` in Handlebars, sia per `form.submitted` sia per `subscription.confirmed`.
- **Token di disiscrizione**: è l'id del Contact (bearer), coerente con la pagina `/rimuovi-sottoscrizione` esistente. Un token casuale dedicato è una scelta più pulita ma è fuori scope.
- **Semantica della revoca**: il consenso si revoca, non si cancella (glossario `Subscriber`/`Contact`). La revoca è una transizione di stato sul Contact; la cancellazione del contatto sul provider resta parte della sincronizzazione best-effort, com'è oggi.
- **Allineamento ADR-0007**: la guardia usa il consenso (`isSubscriber`) come asse separato dalla verifica dell'indirizzo (`emailVerified`), come stabilito dall'ADR. L'incoerenza preesistente per cui `createContactByEmail` concede il consenso al capture resta invariata (vedi Out of Scope).
- **Limite noto del motore**: il motore non ha una exit condition. Un Subscriber che revoca il consenso a metà sequenza viene saltato a ogni invio successivo (nessuna email), ma il Run non viene chiuso. Nessun invio indesiderato; la chiusura anticipata del Run è fuori scope.

### Flusso one-click

1. Il client di posta legge `List-Unsubscribe` + `List-Unsubscribe-Post` e mostra il pulsante nativo.
2. Al click invia un `POST` all'URL con body `List-Unsubscribe=One-Click`.
3. La route revoca il consenso tramite `unsubscribeContactById` e risponde 2xx.
4. Il Subscriber è fuori dalle sequenze (le email successive vengono saltate) e dai broadcast (contatto disiscritto/cancellato sul provider).

## Testing Decisions

Cosa rende buon test qui: si verifica **comportamento esterno** ai confini dei moduli, con provider e transport iniettati/mockati; nessun test su dettagli implementativi interni. Convenzione repo: Vitest contro il database di test (`.env.test`).

- **Seam 1 (primario) — `sendAutomationEmail`**, con `transport` iniettato (prior art: `send-automation-email.test.ts`). Verifica per `purpose = marketing`: il salto quando il consenso è revocato (nessuna chiamata al transport, nessun log); la presenza di `List-Unsubscribe` e `List-Unsubscribe-Post` quando esiste un Contact e l'URL è configurata; l'assenza degli header quando l'URL non è configurata. Verifica per `purpose = transactional`: l'invio avviene anche verso un Contact con consenso revocato e senza header. Verifica che `purpose` assente valga `marketing`.
  - Il selettore "Tipo di email" nel pannello non ha test di componente (convenzione repo: niente component test); si verifica con lint/build e a mano.
- **Seam 2 — `emitFormSubmitted`**, contro il DB di test (prior art: `form-submitted-trigger.test.ts`, `ebook-emit.test.ts`). Verifica: il payload del Run contiene `contactId` quando fornito; non lo contiene quando assente.
- **Seam 3 — `unsubscribeContactById`**, DB di test + adapter provider mockato (prior art: i test di propagate/sync dei contatti). Verifica: il consenso viene revocato senza cancellare il Contact; gli errori del provider non sono propagati; la seconda chiamata è idempotente; id inesistente → `false`.
- **Seam 4 — route `POST /api/newsletter/unsubscribe`**: smoke (prior art: `scheduler/run/route.test.ts`). Verifica: `POST` senza id → 400; `POST` con id valido → 2xx e consenso revocato; `GET` → redirect alla pagina pubblica.

## Out of Scope

- Token di disiscrizione casuale dedicato (si usa l'id del Contact).
- Exit condition nel motore Automations (chiusura anticipata del Run alla revoca).
- Trigger di acquisto (`course_purchased`, `editing_purchased`) e sequenze post-acquisto S3.
- Unsubscribe nativo del provider (mai usato: l'app è single-source-of-truth).
- Modifiche ai broadcast / S4 (già coperti dal provider).
- Correzione della policy di consenso al capture (`createContactByEmail` imposta `isSubscriber = true`): incoerenza preesistente tracciata da ADR-0007.
- UI/UX della pagina pubblica `/rimuovi-sottoscrizione`.
- Header di disiscrizione per le email transazionali non di marketing (conferma iscrizione, ebook gratuito, acquisto webinar).

## Further Notes

- **Prerequisito operativo**: il motore gira in produzione solo se il cron esterno pompa `/api/automations/run/` (stessa env/header di `/api/scheduler/run/`: `SCHEDULED_PUBLICATION_SECRET` / `x-scheduled-publication-secret`). Questo spec non lo implementa, ma le sequenze non partono senza.
- **Contratto per la fase email (S1/S2)**: i template useranno `{{payload.contactId}}` nel footer; il valore è l'id del Contact, che è anche l'`external_id` del contatto sul provider.
- **Riferimenti**: `.scratch/automations/spec.md` (motore), `docs/adr/0005` (engine domain-agnostic), `docs/adr/0007` (consenso vs verifica), `CONTEXT.md` (glossario Contact/Subscriber/Confirmation).
