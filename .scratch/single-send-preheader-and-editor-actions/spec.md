# Single-send preheader e dropdown azioni negli editor — spec

Status: ready-for-agent

## Problem Statement

Tre lacune nelle email `EmailSingleSend` e nella loro editor UI:

- **Preheader assente**: le sequenze (nodo Send Email) supportano il "Preview
  text" (il preheader mostrato dagli inbox accanto all'oggetto) tramite
  `Node.data.previewText` + `applyPreheader`, ma le single send no: `EmailSingleSend`
  ha solo `subject`. Chi scrive una newsletter non può controllare la riga di
  anteprima.
- **Azioni editor disperse**: l'header dell'editor single send
  (`write-form.tsx`) mostra fino a cinque pulsanti (cestino, Save, Schedule /
  Reschedule, Cancel, Send); l'editor template (`template-editor-form.tsx`)
  mostra Save + cestino. Serve raggruppare le azioni secondarie in un menu "…",
  per coerenza tra i due editor.
- **Copertura unsubscribe da chiarire**: la disiscrizione non è gestita ovunque.
  Le sequenze usano l'endpoint dell'app (SSOT), le broadcast usano il canale
  nativo Resend (nessun header custom possibile, nessun webhook inverso). La
  verifica ha prodotto l'ADR-0009: nessuna modifica di codice, l'eccezione è
  documentata.

## Solution

### 1. Preheader nelle single send

- Nuova colonna `previewText String?` su `EmailSingleSend` (nessuna aggiunta su
  `EmailTemplate`: il glossario stabilisce che il preheader accompagna l'oggetto
  di un'email in uscita e non fa parte del design di un template).
- La preview viene inviata **in modo nativo** a Resend: `previewText` passa da
  `sendSingleSend` → `EmailProviderAdapter.sendBulk` → `broadcasts.create`, che
  ha il campo first-class (`node_modules/resend`). Nessun hidden-span, nessuna
  mutazione dell'HTML.
- Input "Preview text (optional)" nell'editor single send sotto il Subject, con
  lo stesso comportamento delle automation: opzionale, hint "most inbox show
  about 100", warning oltre 100 caratteri senza blocco. Nessuna interpolazione
  `{{ }}` (il body single send non è compilato).

### 2. Dropdown azioni negli editor

- **Single send**: pulsante primario `Save`; menu "…" (`DropdownMenu` di
  `src/shared/ui/dropdown-menu.tsx`) con `Send now`, `Schedule send` (o
  `Reschedule` + `Cancel schedule` quando c'è uno schedule attivo) e `Delete`
  distruttivo in fondo, separato.
- **Template**: pulsante primario `Save`; menu "…" con `Delete`. Coerenza anche
  se il menu ha un solo item (spazio per `Duplicate` futuro).
- Convenzione: kebab `Button variant="ghost" size="icon"` + `MoreHorizontalIcon`
  + `DropdownMenuContent align="end"`, come `templates/ui/components/actions.tsx`.

### 3. Unsubscribe (nessun codice)

Nessuna modifica. L'audit è chiuso dall'ADR-0009; la diagnosi del "pulsante
Gmail mancante" sulle sequenze è un non-bug: l'header `List-Unsubscribe` è
presente e corretto, Gmail lo nasconde per euristica di reputazione.

## User Stories

1. Come admin, voglio scrivere la riga di anteprima di una single send, così
   controllo come appare negli inbox accanto all'oggetto.
2. Come admin, voglio vedere l'anteprima salvata quando riapro la single send.
3. Come admin, voglio che l'anteprima venga applicata anche all'invio
   schedulato, così non devo ripetere la configurazione.
4. Come admin, voglio un header editor pulito con una sola azione primaria,
   così non sbaglio cliccando `Delete`.
5. Come admin, voglio le stesse affordance di azione negli editor single send e
   template, così l'interfaccia è coerente.
6. Come sviluppatore, voglio che `previewText` attraversi lo stesso seam del
   provider degli altri payload, così non introduco percorsi speciali.

## Implementation Decisions

### Modello e API

- `prisma/schema.prisma`: `EmailSingleSend` acquisisce `previewText String?`.
  Nuova migrazione (`npx prisma migrate dev`). `EmailTemplate` invariato.
- `single-sends/schemas.ts`: `previewText: z.string().optional()` su insert e
  update.
- `single-sends/server/procedures.ts` + tipi: `create`, `update`, `getOne`,
  `getMany` includono `previewText`.
- `send-single-send.ts`: passa `previewText: singleSend.previewText` a
  `sendBulk` (invio immediato e schedulato, stesso percorso).

### Adapter

- `mails/lib/types.ts`: `sendBulk` acquisisce `previewText?: string`.
- `adapters/resend-adapter.ts`: inoltra `previewText` a
  `resendClient.broadcasts.create` (il campo nativo). Aggiornare gli adapter
  mock nei test.
- Nessun cambiamento a `applyPreheader`/`preheader.ts` (resta per le
  sequenze, dove `emails.send` non ha il campo nativo).

### UI

- `write-form.tsx`: campo controllato `previewText` sotto il Subject via
  `GenericInput` o `FormField`; incluso in `values` e nel payload di `update`.
- `write-form.tsx`: header azioni → `Save` primario + menu "…" con
  Send/Schedule/Reschedule/Cancel/Delete. `onSend` continua a inviare la
  versione **persistita**; `Save` resta l'azione primaria (out of scope:
  auto-save-before-send).
- `template-editor-form.tsx`: header azioni → `Save` primario + menu "…" con
  `Delete`.

## Testing Decisions

Convenzione repo: Vitest contro il database di test (`env.test`), test sul
comportamento esterno, non su dettagli implementativi.

- **`send-single-send`**: adapter mock iniettato; verifica che `previewText`
  salvato venga passato a `sendBulk` e che l'assenza produca `undefined`.
- **Adapter Resend**: verifica che `sendBulk` inoltri `previewText` a
  `broadcasts.create` (mock del client Resend).
- **Schema/procedure**: il round-trip create → getOne conserva `previewText`.
- **UI**: non ci sono test di componente nel modulo; verifica con lint/build e a
  mano (input visibile, salvataggio, dropdown con le voci corrette per stato).

## Out of Scope

- Preheader sui `EmailTemplate` (il glossario lo esclude dal design del
  template).
- Interpolazione `{{ }}` nel preheader delle single send.
- Auto-salvataggio prima dell'invio (`Send` continua a usare la versione
  persistita).
- Riconciliazione dell'unsubscribe broadcast (webhook Resend): rimandato,
  ADR-0009.
- Header `List-Unsubscribe` custom sulle broadcast: non possibile via SDK.
- Unsubscribe sui transazionali (conferma iscrizione, ebook, webinar).

## Further Notes

- **Fatti chiave**: `EmailSingleSend.subject` (`schema.prisma`); `sendBulk`
  (`mails/lib/adapters/resend-adapter.ts:577`); `applyPreheader`
  (`mails/automations/lib/preheader.ts`); input preview delle automation
  (`mails/automations/ui/send-email-config-panel.tsx:85-102`); merge tag del link
  di disiscrizione broadcast `{{{contact.external_id}}}`, con la proprietà
  `external_id` sincronizzata in `resend-adapter.ts:124`.
- **Riferimenti**: `docs/adr/0009-provider-native-unsubscribe-on-broadcasts.md`,
  `docs/adr/0008-consent-policy-at-mail-effect-boundary.md`,
  `.scratch/subscriber-unsubscribe/spec.md` (preheader e unsubscribe delle
  sequenze), `CONTEXT.md` (glossario Preheader / Email template).
