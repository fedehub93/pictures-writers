# 02: Scritture canoniche, lookup case-insensitive, idempotency key sull'indirizzo

**What to build:** Ogni scrittura dell'indirizzo passa da `normalizeEmail` e ogni lookup è case-insensitive con un ordine deterministico. È la lookup insensitive — non una migration — che rende innocue le 7 coppie legacy: chi ritorna con una maiuscola ritrova la riga esistente invece di crearne una nuova. Le due emissioni verso le automazioni smettono di usare il `contactId` come chiave.

**Blocked by:** 01.

**Status:** resolved

## Helper condiviso

- [x] `createContactByEmail` normalizza l'input, mantiene find-then-create, aggiunge il catch di `P2002` con ri-lettura tramite `getContactByEmail`
- [x] `getContactByEmail` usa `{ email: { equals, mode: "insensitive" } }` con `orderBy: { createdAt: "asc" }`
- [x] Accanto alla lookup c'è un commento che spiega perché l'insensitive non va rimosso pur essendo "ridondante" con la forma canonica: senza, le righe legacy diventano irraggiungibili e ogni ritorno crea una riga nuova
- [x] Email `null` o vuota: nessun contatto creato, nessun errore fatale

## Entry point pubblici

- [x] `subscribe`: normalizza prima di creare, emettere `form.submitted` e generare il token; emette l'email del contatto salvato, non quella del form
- [x] `contact`: normalizza email del contatto e copia della submission
- [x] `submit-form`: normalizza email del contatto e copia della submission
- [x] `submit-product-form`: normalizza; se l'email manca **non** crea il contatto (allineato alla REST route) invece di passare `null` a `create`
- [x] `api/products/[rootId]/submission`: normalizza prima di creare e di emettere
- [x] `subscribe-free-digital-product`: sostituisce il solo `trim()` esistente con il normalizzatore
- [x] Webhook Stripe → `sendWebinarPurchaseEmail`: se `customer_details.email` è assente o vuota, nessun contatto creato

## Backoffice

- [x] `contacts.create`: normalizza; collisione intercettata con la lookup insensitive → messaggio esplicito ("contatto già esistente"), non il testo dell'errore Prisma, nessun riuso silenzioso
- [x] `conversations.createContact`: delega al helper (o normalizza), perde la lookup `mode: "insensitive"` duplicata
- [x] `Conversation.contactEmail` normalizzato in scrittura (ingresso e uscita), invariato il vincolo di non unicità

## Token, conferma, consegna

- [x] `generateSubscriptionToken` e `getSubscriptionTokenByEmail` normalizzano, così la deduplica dei token per indirizzo funziona davvero
- [x] `new-subscription` normalizza in lettura e **scrive la forma canonica**, non `existingToken.email`
- [x] `sequence-delivery-policy` normalizza e usa la lookup insensitive prima di `findUnique({ where: { email } })`

## Automazioni

- [x] `forms/automations/emit.ts` e `mails/automations/emit.ts` usano `normalizeEmail(email)` come `idempotencyKey` invece del `contactId`
- [x] Il payload del run contiene l'indirizzo canonico, così che i run in admin mostrino la stessa forma del DB

## Test

- [x] **Compatibilità legacy:** con una riga `Mario@x.com` già presente e nessuna riga canonica, una cattura `mario@x.com` restituisce la riga esistente e **non ne crea una nuova** — è il test che protegge la scelta di non fare backfill
- [x] Con due righe che matchano, la lookup restituisce sempre la più vecchia
- [x] Due catture concorrenti producono un solo Contact e nessun errore propagato al visitatore
- [x] Due emissioni con case diverso producono un solo run, con chiave canonica
- [x] `FormSubmission.email` è canonico mentre `FormSubmission.data` conserva la grafia digitata
- [x] L'admin che crea un contatto esistente riceve l'errore esplicito e non crea righe
- [x] Un contatto confermato resta canonico dopo il passaggio in `new-subscription`

## Comments

Delivered:

- `src/data/email-contact.ts`: `createContactByEmail` normalizes (null/empty → no Contact), keeps find-then-create and re-reads after a `P2002`; `getContactByEmail` normalizes, matches `mode: "insensitive"` and orders `createdAt: "asc"` (with the comment explaining why the insensitive match must not be removed without a backfill).
- Public paths wired: `subscribe`, `contact`, `submit-form`, `submit-product-form` (no Contact/emit when the address is missing), the product REST route, `subscribe-free-digital-product`, and the Stripe webhook → `sendWebinarPurchaseEmail` (empty address returns before creating a Contact or sending).
- Backoffice: `contacts.create` normalizes, rejects an existing address through the insensitive lookup with `CONFLICT` ("A contact with this email already exists."), also catches the insert race, and never reuses the row silently. `conversations.createContact` now uses the shared helper; `Conversation.contactEmail` is canonical on inbound and outbound writes.
- Tokens/confirmation: both token helpers normalize and look up insensitively; `generateSubscriptionToken` deletes every spelling for the address; `new-subscription` writes the canonical email (falling back to the stored spelling only when canonicalising would collide with a legacy twin) and emits the canonical address; `sequence-delivery-policy` normalizes and uses the same insensitive lookup.
- Automations: `forms/automations/emit.ts` and `mails/automations/emit.ts` use `normalizeEmail(email)` as the idempotency key and put the canonical address in the run payload; `contactId` stays in the payload but is no longer the key.
- Tests: legacy uppercase row is reused without a canonical twin; the oldest row wins; concurrent captures produce one Contact without throwing; two case variants of an emit produce one Run keyed by the canonical address; `FormSubmission.email` is canonical while `data` keeps the typed spelling; admin create returns the explicit conflict and writes nothing; confirmation canonicalises the contact (including the legacy-pair collision path); an email-less product form stores the submission with no Contact and no Run; the webinar email ignores an empty address. Full suite: 194 files / 1607 tests green.
