# Contact identity: una forma canonica a monte, lookup case-insensitive

**Status:** `ready-for-agent`

## Problem Statement

`EmailContact.email` è l'unica identità di un Contact, ma è salvata e confrontata esattamente come digitata: `email String @unique` è un indice case-sensitive (`prisma/schema.prisma:674`, `EmailContact_email_key` in `0_init/migration.sql:458`), e `createContactByEmail` fa `findFirst({ where: { email } })` senza normalizzare (`src/data/email-contact.ts:5`). Il risultato: `Mario@example.com` e `mario@example.com` sono due Contact.

Le conseguenze non sono cosmetiche, perché a valle il sistema li tratta già come una persona sola:

- **Il provider li collassa.** `upsertContact` cerca il contatto con `contacts.get({ email })` (`resend-adapter.ts:469`), quindi entrambe le righe locali risolvono allo stesso contatto Resend e la seconda upsert sovrascrive la property `external_id` con l'id del perdente.
- **Le automazioni partono due volte.** L'engine deduplica su `(automationId, idempotencyKey)` e la chiave è il `contactId` scelto dal chiamante (`forms/automations/emit.ts:58`, `mails/automations/emit.ts:37`, ADR-0005). Due id diversi = due run = due email.
- **La conferma annulla la normalizzazione.** `new-subscription.ts:38` riscrive `email: existingToken.email`, cioè la grafia grezza del signup.

Il modulo conversazioni ha già deciso la regola opposta: normalizza a lowercase in ingresso e in uscita (`handle-inbound-email.ts:119`, `send-new-message.ts:77`) e cerca con `mode: "insensitive"` (`conversations/server/procedures.ts:660`). Una parte del dominio assume già l'identità case-insensitive; il resto no.

Dati attuali: **7 gruppi di duplicati, tutti e soli per differenza di maiuscole, tutti vecchi.** Il problema però non si è esaurito: ogni nuovo visitatore che digita una maiuscola crea una coppia nuova, oggi come ieri.

Difetti adiacenti che il fix porta a galla:

- `createContactByEmail` è find-then-create senza transazione: due catture concorrenti possono collidere sull'unique (`P2002` non gestito).
- Il webhook Stripe può creare un contatto con `email: ""` (`api/webhooks/stripe/route.ts:27`) e `submit-product-form.ts:60` passa `null` in `create({ email: null })`. Con un'unica identità canonica, `""` diventa *il* contatto di tutte le submission anonime.

## Solution

Trattare l'indirizzo come identità case-insensitive **senza toccare i dati esistenti**:

- **Scritture canoniche.** Ogni scrittura passa da `normalizeEmail` (`trim` + lowercase): i nuovi contatti nascono canonici.
- **Lookup case-insensitive.** Ogni lettura per indirizzo usa `mode: "insensitive"`, con un ordine deterministico. È questa riga — non la migration — che rende innocue le 7 coppie legacy.
- **Le 7 coppie restano dove sono.** Diventano reperti inerti: la lookup restituisce sempre la stessa riga, quindi ricevono sempre gli stessi eventi e non partono più due automazioni.
- **Nessun vincolo nel database.** L'indice esatto su `email` resta e protegge le scritture canoniche; il `CHECK` e l'indice funzionale su `lower(email)` sono rinviati, perché non possono esistere finché le 7 coppie sono lì (ADR-0034).
- **Idempotency key sull'email canonica** invece che sul `contactId`, nelle due emissioni interne: rende impossibile il doppio run anche se una coppia dovesse ricomparire per una race.

Il prezzo dichiarato: la garanzia è a un unico punto di passaggio, non strutturale. Un percorso futuro che dimentica il normalizzatore può ancora creare una variante — ma il fallimento è un duplicato visibile, non un mapping provider corrotto.

## User Stories

1. Come visitatore, voglio iscrivermi con `Mario@x.com` quando esiste già `mario@x.com` e ritrovarmi sullo stesso Contact, così che non venga creata una seconda riga.
2. Come visitatore, voglio che la risposta del form sia identica sia che l'indirizzo esista sia che non esista, così che nessuno possa sondare chi è in lista.
3. Come amministratore, voglio un solo Contact per indirizzo per i contatti nuovi, così che audience e storico non divergano più.
4. Come amministratore, voglio un errore esplicito quando creo un contatto che esiste già, così che non debba interpretare un messaggio di violazione di vincolo.
5. Come marketer, voglio che un'automazione parta una volta sola per persona, così che nessuno riceva due sequenze.
6. Come sviluppatore, voglio un unico punto di normalizzazione, così che i nove percorsi di cattura non divergano di nuovo.
7. Come operatore, voglio che il rilascio non richieda migration né finestre di manutenzione, così che il rischio sia quello di un deploy ordinario.
8. Come manutentore, voglio che le 7 coppie legacy non producano più effetti, così che ripulirle sia una scelta di ordine e non un prerequisito.

## Implementation Decisions

### 1. Normalizzatore unico

Un solo modulo esporta `normalizeEmail(raw: string): string | null`:

- `trim()` poi `toLowerCase()`;
- stringa vuota o solo whitespace → `null` (il chiamante decide se l'email è obbligatoria);
- nessun `normalize("NFC")`, nessun punycode, nessun collasso di `+tag` o punti;
- nessuna validazione di formato: quella resta a Zod ai bordi, questo è solo identità.

`null` è il segnale convenuto per "nessun indirizzo", e i percorsi che legittimamente possono non averlo (form prodotto, webhook Stripe) **non creano** il contatto — comportamento che la REST route già adotta (`api/products/[rootId]/submission/route.ts:68`) e che gli altri due percorsi devono adottare.

### 2. Lookup case-insensitive e deterministiche

`getContactByEmail` diventa:

```ts
db.emailContact.findFirst({
  where: { email: { equals: email, mode: "insensitive" } },
  orderBy: { createdAt: "asc" },
})
```

- `mode: "insensitive"` è ciò che rende innocue le righe legacy: chi ritorna con una maiuscola ritrova la riga vecchia invece di crearne una nuova.
- `orderBy: createdAt "asc"` rende deterministica la scelta quando due righe matchano (le 7 coppie): vince sempre la più vecchia, così gli eventi futuri non oscillano tra le due.
- Nota tecnica: `mode: "insensitive"` non usa l'indice btree su `email`. Irrilevante a questa scala; è il motivo per cui l'indice funzionale resta la versione "pulita" rinviata.

### 3. Il design da non fare

Normalizzare le **scritture** lasciando le lookup **esatte** è peggio dello status quo: ogni riga legacy diventa irraggiungibile, al ritorno della persona si crea una riga canonica nuova, e la vecchia conserva audience e mapping provider mentre la nuova propaga senza — stato diviso invece di un duplicato visibile. Questo va scritto nel codice come commento accanto alla lookup, perché è il refactor "semplificativo" che qualcuno farà.

### 4. Scritture atomiche

`createContactByEmail` mantiene find-then-create e aggiunge il catch di `P2002` con ri-lettura tramite `getContactByEmail`. Niente `upsert({ update: {} })`: tocca `updatedAt` a ogni cattura senza necessità.

### 5. Percorsi da convertire

Tutti devono passare da `normalizeEmail` in scrittura e da lookup insensitive in lettura:

| Percorso | Punto di scrittura/lookup |
| --- | --- |
| Helper condiviso | `src/data/email-contact.ts:5`, `:31`, `:34` |
| Newsletter | `src/actions/subscribe.ts:36`, `:44`, `:55` |
| Contact form | `src/actions/contact.ts:49` |
| Form generici | `src/actions/submit-form.ts:68` |
| Product form action | `src/actions/submit-product-form.ts:60`, `:71` |
| Product form REST | `src/app/api/products/[rootId]/submission/route.ts:57`, `:72` |
| Lead magnet | `src/actions/subscribe-free-digital-product.ts:109` |
| Webhook Stripe | `src/app/api/webhooks/stripe/route.ts:27` → `mails/lib/mail.ts:179` |
| Admin tRPC create | `src/modules/mails/contacts/server/procedures.ts:22` |
| Conversazioni | `src/modules/mails/conversations/server/procedures.ts:660`, `:670` |
| Token di iscrizione | `src/lib/tokens.ts:10`, `src/data/subscription-token.ts:17` |
| Conferma | `src/actions/new-subscription.ts:25`, `:38` |
| Policy di consegna | `src/modules/mails/automations/lib/sequence-delivery-policy.ts:78` |

Note:

- `new-subscription.ts:38` deve scrivere la forma canonica, non `existingToken.email`: è il punto in cui l'identità verrebbe annullata alla prima conferma, e l'unico che riscrive una riga già esistente.
- I payload emessi verso le automazioni (`emitFormSubmitted`, `emitSubscriptionConfirmed`) devono portare l'email **del contatto** (`contact.email`), non quella grezza del form.
- `FormSubmission.email` e `Conversation.contactEmail` normalizzati in scrittura per restare joinabili, senza vincolo di unicità: più righe per indirizzo sono legittime.
- L'admin create intercetta la collisione tramite la lookup insensitive e restituisce un messaggio esplicito ("contatto già esistente") invece dell'errore Prisma, senza riuso silenzioso.
- `conversations.createContact` può delegare al helper e perdere la sua lookup `mode: "insensitive"` duplicata.

### 6. Idempotency key sull'indirizzo

Le due emissioni interne (`forms/automations/emit.ts:58`, `mails/automations/emit.ts:37`) passano da `contactId` a `normalizeEmail(email)` come chiave.

- Resta dentro ADR-0005: la chiave è opaca e la sceglie il chiamante.
- Rende il doppio run impossibile anche se due righe tornassero a esistere (race, percorso futuro che bypassa il helper).
- Effetto collaterale accettato: due contatti diversi con lo stesso indirizzo non possono più generare due run, che è esattamente la regola di identità.

### 7. Le 7 coppie legacy

Non vengono toccate. Restano un artefatto storico: due righe per la stessa persona, entrambe raggiungibili dalla lookup insensitive, con la più vecchia che intercetta tutti gli eventi futuri.

Conseguenza da verificare, non da correggere: il conteggio contatti in admin resterà 7 unità più alto del numero di persone reali. Se e quando darà fastidio, la pulizia è un merge di 7 coppie con id espliciti (~30 righe di SQL) seguito, se si vuole la garanzia strutturale, dall'indice funzionale.

### 8. Rollout

Un deploy ordinario, senza migration e senza finestre: nessun dato viene riscritto, quindi la vecchia istanza che continua a servire durante il rolling deploy non può fare danni nuovi. Le issue 01 e 02 vanno insieme; la 03 (consenso) è indipendente e può precedere o seguire.

## Testing Decisions

I test verificano comportamento esterno: stato del DB dopo l'operazione, trigger emessi, errori restituiti.

1. **Normalizzatore** — tabella di casi: spazi ai bordi, maiuscole, `""`, `"   "`, `"Mario+news@X.com"` → `"mario+news@x.com"`, non-ASCII invariata oltre al case.
2. **Helper** — varianti di case restituiscono lo stesso Contact e una sola riga; due chiamate concorrenti producono una riga sola (catch `P2002`); email `null`/vuota non crea nulla.
3. **Compatibilità legacy** — con una riga `Mario@x.com` già presente (e nessuna riga canonica), una cattura `mario@x.com` **restituisce la riga esistente e non ne crea una nuova**. È il test che protegge la decisione di non fare backfill: se qualcuno rimuove `mode: "insensitive"`, questo test deve rompersi.
4. **Determinismo** — con due righe che matchano, la lookup restituisce sempre la più vecchia.
5. **Automazioni** — due emissioni per lo stesso indirizzo con case diverso producono un solo run; la chiave persistita è l'indirizzo canonico.
6. **Percorsi pubblici** — `FormSubmission.email` canonico, `FormSubmission.data` con la grafia digitata; email assente nel product form e nello Stripe webhook → nessun contatto creato.
7. **Admin** — creare un contatto con case diverso da uno esistente restituisce l'errore esplicito e non crea righe.

*Prior art:* `src/actions/__tests__/subscribe-free-digital-product.test.ts`, `src/modules/forms/automations/__tests__/form-submitted-trigger.test.ts`, `src/modules/mails/conversations/server/__tests__/conversations-router.test.ts`, `src/modules/mails/lib/core/contacts/__tests__/unsubscribe.test.ts`.

## Out of Scope

- **Backfill delle 7 coppie.** Scelta deliberata, non dimenticanza: non producono più effetti e ripulirle non cambia nulla di osservabile tranne il conteggio in admin.
- **Vincolo strutturale** (`CHECK` o indice funzionale su `lower(email)`). Rinviato perché richiede il backfill; l'ADR-0034 registra la condizione per riaprirlo.
- **`+tag`, punti Gmail, punycode/IDN, NFC.** Cambierebbero l'indirizzo a cui si spedisce e richiedono un segnale di identità corroborante che non esiste.
- **Identità di persona** (`mario@` vs `mario.doe@` vs `mario@altra-azienda.it`). Problema diverso, nessun merge in-app.
- **Strumento di merge manuale.** Non necessario finché l'unicità regge a monte.
- **Import CSV.** Non esiste nel prodotto; l'import audience collega contatti esistenti per interaction type.
- **Deduplica dei destinatari al momento dell'invio.** `sendSingleSend` crea un broadcast per Audience: un contatto in due Audience selezionate riceve due email. Comportamento identico a Mailchimp, indipendente dall'identità, da affrontare separatamente.
- **Riparazione retroattiva** delle email e dei run già emessi due volte.
- **Consenso per Audience.** `isSubscriber` resta globale al contatto.

## Further Notes

- Il modulo conversazioni è già case-insensitive: dopo questo lavoro l'intero sistema usa la stessa regola.
- `EmailContactInteraction` è una stringa libera con unique `(contactId, interactionType)`; nessuna implicazione finché non si fa il merge rinviato.
- `generateSubscriptionToken` cancella "il token esistente" con match esatto (`tokens.ts:10`): con la lookup insensitive la deduplica dei token funziona davvero.
- Query di monitoraggio da tenere a portata di mano: deve restare a 7 gruppi e non crescere.

```sql
SELECT lower(email), count(*) FROM "EmailContact"
GROUP BY lower(email) HAVING count(*) > 1;
```
