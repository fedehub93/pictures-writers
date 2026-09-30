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
- **Policy di consegna nel dominio contatti**: guardia di consenso e header di posta non entrano nel nodo Send Email né in `sendAutomationEmail`. Vivono in una policy che decora l'effetto `mail` nell'unico punto di composizione del runtime (ADR-0008). Nodo e primitivo di invio restano generici e ignari dei Contact.
- **Guardia di consenso**: la policy risolve il Contact dal destinatario; se esiste e il consenso è revocato (`isSubscriber = false`), l'invio viene **saltato** (nessuna email, nessun log, Step non in errore). L'unica capacità generica aggiunta a `GenericEmail` è il passthrough di `headers` — concetto di trasporto, non di dominio.
- **Header di posta**: la policy inietta `List-Unsubscribe` e `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, puntati a un endpoint interno dell'app, quando il destinatario è un Contact e l'URL è configurata.
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
17. Come sviluppatore, voglio testare il comportamento al confine della policy di consegna (effetto interno iniettabile) e al confine della revoca (DB di test + adapter mockato), così non testo dettagli implementativi.
18. Come admin, voglio che la guardia di consenso e gli header siano applicati automaticamente a ogni invio di sequenza, così non devo configurarli nodo per nodo.
19. Come admin, voglio che il nodo Send Email resti generico (nessun campo marketing/transazionale), così non introduco semantica dei Contact nei nodi riusabili.
20. Come sviluppatore, voglio che consenso e header siano una policy di dominio contatti al confine dell'effetto mail, così nodo e primitivo di invio restano domain-agnostic (ADR-0005, ADR-0008).

## Implementation Decisions

### Moduli e interfacce modificati

- **Modulo mails — nodo Send Email**: **nessuna modifica**. Resta un'azione generica: niente `purpose`, niente selettore nel pannello. Deve continuare a non conoscere i Contact.
- **Modulo mails — policy di consegna delle sequenze** (dominio contatti): decora l'effetto `mail` nel punto di composizione del runtime (`createAutomationRuntimeEffects`). Legge il destinatario dalla request dell'effetto; risolve l'`EmailContact` per email; se esiste e `isSubscriber = false` ritorna `{ sent: false, skipped: true }` senza chiamare l'effetto interno (nessuna email, nessun log); altrimenti inietta gli header `List-Unsubscribe`/`List-Unsubscribe-Post` (quando il Contact esiste e l'URL è configurata) e delega all'effetto interno. L'effetto interno è iniettabile per i test.
- **Modulo mails — funzione di invio email di automazione** (`sendAutomationEmail`): **nessuna guardia di consenso e nessun lookup di Contact**. L'unica aggiunta è inoltrare `headers` al provider (capacità generica).
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
- **Allineamento ADR-0008**: guardia di consenso e header sono una policy di dominio al confine dell'effetto mail; nodo Send Email, `sendAutomationEmail` e il motore restano domain-agnostic.
- **Limite noto del motore**: il motore non ha una exit condition. Un Subscriber che revoca il consenso a metà sequenza viene saltato a ogni invio successivo (nessuna email), ma il Run non viene chiuso. Nessun invio indesiderato; la chiusura anticipata del Run è fuori scope.

### Flusso one-click

1. Il client di posta legge `List-Unsubscribe` + `List-Unsubscribe-Post` e mostra il pulsante nativo.
2. Al click invia un `POST` all'URL con body `List-Unsubscribe=One-Click`.
3. La route revoca il consenso tramite `unsubscribeContactById` e risponde 2xx.
4. Il Subscriber è fuori dalle sequenze (le email successive vengono saltate) e dai broadcast (contatto disiscritto/cancellato sul provider).

## Testing Decisions

Cosa rende buon test qui: si verifica **comportamento esterno** ai confini dei moduli, con provider e transport iniettati/mockati; nessun test su dettagli implementativi interni. Convenzione repo: Vitest contro il database di test (`.env.test`).

- **Seam 1 (primario) — policy di consegna**, con l'effetto interno iniettato (un recorder in-memory) + DB di test. Verifica: il salto quando il consenso è revocato (nessuna chiamata all'effetto interno, nessun log); l'invio quando il consenso è presente o il destinatario non è un Contact; la presenza di `List-Unsubscribe` e `List-Unsubscribe-Post` quando esiste un Contact e l'URL è configurata; l'assenza degli header quando l'URL non è configurata o il destinatario non è un Contact.
  - Non ci sono test di componente né per il pannello del nodo (che non cambia) né per il selettore (che non esiste); si verifica con lint/build e a mano.
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
- Campo `purpose` / distinzione marketing-transazionale sul nodo Send Email: non modellata. Un'eventuale eccezione transazionale dentro una sequenza è una futura decisione di policy, non una property del nodo.

## Further Notes

- **Prerequisito operativo**: il motore gira in produzione solo se il cron esterno pompa `/api/automations/run/` (stessa env/header di `/api/scheduler/run/`: `SCHEDULED_PUBLICATION_SECRET` / `x-scheduled-publication-secret`). Questo spec non lo implementa, ma le sequenze non partono senza.
- **Contratto per la fase email (S1/S2)**: i template useranno `{{payload.contactId}}` nel footer; il valore è l'id del Contact, che è anche l'`external_id` del contatto sul provider.
- **Riferimenti**: `.scratch/automations/spec.md` (motore), `docs/adr/0005` (engine domain-agnostic), `docs/adr/0007` (consenso vs verifica), `docs/adr/0008` (policy di consegna al confine dell'effetto mail), `CONTEXT.md` (glossario Contact/Subscriber/Confirmation).
