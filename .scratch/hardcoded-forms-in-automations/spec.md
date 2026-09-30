# Form hardcoded nelle automazioni — spec

Status: ready-for-agent

## Problem Statement

Il nodo trigger `form.submitted` fa partire un'Automation da una submission. Oggi è **scopato per-form**: il pannello di configurazione è una select popolata da `forms.getMany` e il matching confronta `readConfiguredFormId(node.data)` con l'`formId` del payload. Solo `src/actions/submit-form.ts` (form dinamici: blocchi Puck e pagine submission) emette l'evento.

Tre percorsi pubblici però **non emettono**:

- **Contatto (home)** — `src/app/(home)/_components/contact-us.tsx` → `src/actions/contact.ts`. La UI è hardcoded, ma l'action scrive una `FormSubmission` con `formId: "cad10953-192a-423f-9d75-852a2b26034f"` hardcoded: è il form dinamico usato dalla pagina Puck `/contatti` (il cui id vive in `Page.puckData`).
- **Newsletter** — `src/shared/components/widget/newsletter.tsx` → `src/actions/subscribe.ts`. Lead-capture puro: `EmailContact` + interazione `user_subscribed`, nessuna riga `Form`.
- **eBook** — `free-ebook-modal.tsx` e `product-pop.tsx` → `src/actions/subscribe-free-ebook.ts`. Lead-capture puro: `EmailContact` + interazione `ebook_downloaded`, nessuna riga `Form`.

Inoltre due percorsi di form **prodotto** (dinamici ma con action dedicata) scrivono `FormSubmission` senza emettere: `src/actions/submit-product-form.ts` e `src/app/api/products/[rootId]/submission/route.ts`.

Conseguenza: chi pubblica un'Automation su questi form non la vede mai partire.

Vincolo: i componenti hardcoded non possono ancora diventare form dinamici. Serve una soluzione **temporanea** che dia loro un'identità con cui il trigger possa lavorare, senza cambiarne il rendering.

## Solution

Dare a ogni percorso di submission un'identità `Form` e far emettere `form.submitted` alle action:

- **Contatto**: riusa l'identità già esistente (il form dinamico di `/contatti`). Nessuna riga nuova; `contact.ts` aggiunge `emitFormSubmitted`.
- **Newsletter / eBook**: due righe `Form` "ombra" create da una data migration con id stabili e leggibili. Non vengono renderizzate da nessuna pagina: esistono solo perché il picker del trigger (`forms.getMany`) le elenchi. Le rispettive action emettono.
- **Form prodotto**: aggiungono l'emit (stesso pattern, `product.formId`).
- **Niente** persistenza `FormSubmission` aggiuntiva, **niente** flag `isSystem`, **niente** convergenza delle UI hardcoded sui form dinamici.
- Id stabili condivisi in un unico modulo di costanti.
- Emit **non bloccante** (try/catch): un errore di automazione non deve mai bloccare la submission (come in `submit-form.ts`).

## User Stories

1. Come admin, voglio che una submission dal form contatti della home faccia partire un'Automation scopata al form contatti, così posso inviare una nurture.
2. Come admin, voglio che un'iscrizione alla newsletter faccia partire un'Automation scopata al form newsletter.
3. Come admin, voglio che un download ebook faccia partire un'Automation scopata al form ebook.
4. Come admin, voglio che anche una submission di un form prodotto faccia partire l'Automation corrispondente.
5. Come admin, voglio selezionare questi form nel pannello del trigger `form.submitted`, così non devo scrivere id a mano.
6. Come sviluppatore, voglio che l'identità dei form non ancora dinamici sia stabile tra ambienti, così le automazioni non si rompono in dev/test/prod.

## Implementation Decisions

### Identità

- **Contatto**: id esistente `cad10953-192a-423f-9d75-852a2b26034f`, **non toccare**: è referenziato in `Page.puckData` di `/contatti` e da eventuali `FormSubmission` storiche.
- **Newsletter**: id `built-in-form-newsletter`, nome `Newsletter (interno)`.
- **eBook**: id `built-in-form-ebook`, nome `eBook (interno)`.
- **Data migration idempotente** (`INSERT ... ON CONFLICT DO NOTHING`, coerente col precedente `Role`/`Permission` — `prisma/migrations/20260913100000_permission_backed_authorization`). Solo i campi richiesti (`id`, `name`, `updatedAt`); `fields`/`content` restano `NULL`.
- **Costanti condivise** in un unico modulo del modulo forms (es. `src/modules/forms/built-in-forms.ts`) usate dalle action; la migration porta gli stessi id come SQL letterale, documentati in quel punto unico.

### Emissione

- Chiamata `emitFormSubmitted({ formId, email, contactId, data })` con idempotency key `contactId ?? email` (le action già creano/recuperano il contatto: catturare `contact.id`).
- `data` = valori grezzi: contatto `{ name, email, subject, message }`; newsletter `{ email }`; ebook `{ email, rootId, format }`; prodotto = `values`.
- Emit in `try/catch` con log, **mai** bloccante.
- **Contatto**: mantenere `handleContactRequested()` (notifica `CONTACT_REQUESTED`); **non** aggiungere `handleFormSubmitted()`.
- **Newsletter/eBook**: nessuna `FormSubmission`; restano le interazioni esistenti.

### Robustezza (nota)

- Il matching del trigger confronta **stringhe**: nessuno risolve `formId` contro la tabella `Form`. Cancellare una riga ombra **non** rompe le automazioni già pubblicate; fa solo sparire la voce dal picker.

## Testing Decisions

- Estendere i test Vitest esistenti (`src/modules/forms/automations/__tests__/form-submitted-trigger.test.ts`) per: emit dal form contatti con l'id esistente; emit newsletter/ebook con gli id stabili; scoping corretto (un'Automation su un altro form non parte); le righe seedate esistono nel test DB.
- Smoke manuale end-to-end: pubblicare un'Automation scopata a `built-in-form-newsletter`, inviare la newsletter, verificare il Run nell'Executions screen.
- `npm run lint` + `npx tsc --noEmit`.

## Out of Scope

- Rendere dinamici i componenti hardcoded (contatto/newsletter/ebook): il rendering resta hardcoded.
- Flag `isSystem` sul modello `Form` e filtering di admin/Puck picker (visibilità accettata).
- Persistere `FormSubmission` per newsletter/ebook.
- Convergenza della home su `submitForm()` (reCAPTCHA action e schema diversi).
- Nuovi trigger dedicati alle lead-capture (`lead.captured`, `contact.subscribed`), ADR dedicato, o termini di glossario per l'identità temporanea. → Il trigger di conferma newsletter (`subscription.confirmed`) e il glossario/ADR sono ora affrontati nel follow-up `.scratch/subscription-confirmed-trigger/`; l'emit `form.submitted` di questa spec resta invariato.
- Unificare le notifiche admin (`CONTACT_REQUESTED` vs `FORM_SUBMITTED`).

## Further Notes

- È una soluzione **temporanea**: quando contatto/newsletter/ebook diventeranno form dinamici, l'identità `Form` esiste già, quindi le automazioni non vanno riagganciate; cambierà solo il rendering.
- Il motivo per cui non si tocca l'id del contatto e non si aggiunge `isSystem` è documentato qui (e non in `CONTEXT.md`/ADR, che restano durevoli).
- Riferimento: `.scratch/automations/issues/09-form-submitted-trigger.md` (follow-up "other submission entry points").
