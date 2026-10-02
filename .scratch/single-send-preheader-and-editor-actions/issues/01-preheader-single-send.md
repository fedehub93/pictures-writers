# 01: Preheader nelle single send (modello → adapter → UI)

**What to build:** Slice verticale del "Preview text" per `EmailSingleSend`,
dal DB fino all'invio nativo Resend e all'editor.

- **Modello/API**: `EmailSingleSend.previewText String?` con migrazione;
  `previewText: z.string().optional()` nello schema insert/update; le procedure
  `create`/`update`/`getOne`/`getMany` e i tipi portano il campo.
  `EmailTemplate` resta invariato (il preheader non fa parte del design del
  template).
- **Adapter**: `EmailProviderAdapter.sendBulk` acquisisce `previewText?: string`;
  l'adapter Resend lo inoltra a `broadcasts.create` (campo first-class, nessun
  hidden-span). Adapter mock dei test aggiornati.
- **Invio**: `send-single-send.ts` passa `previewText: singleSend.previewText`
  (invio immediato e schedulato, stesso percorso).
- **UI**: input "Preview text (optional)" in `write-form.tsx` sotto il Subject,
  incluso nei `values` e nel payload di `update`. Comportamento speculare a
  `send-email-config-panel.tsx:85-102`: opzionale, hint "most inbox show about
  100", warning non bloccante oltre 100 caratteri, nessuna interpolazione
  `{{ }}`.

**Blocked by:** —

**Status:** resolved

- [x] `prisma/schema.prisma`: `previewText String?` su `EmailSingleSend` + migrazione e client rigenerato.
- [x] `single-sends/schemas.ts`: `previewText` su insert e update.
- [x] `single-sends/server/procedures.ts` + tipi: `create`/`update` persistono, `getOne`/`getMany` restituiscono.
- [x] `lib/types.ts`: `sendBulk` acquisisce `previewText?: string`.
- [x] `adapters/resend-adapter.ts`: `previewText` inoltrato a `broadcasts.create`.
- [x] `send-single-send.ts`: passa `previewText`.
- [x] `write-form.tsx`: campo `previewText` (values + payload) con hint/warning.
- [x] Test: round-trip create → getOne; `send-single-send` passa il valore (assente → `undefined`); adapter inoltra a `broadcasts.create` (client mockato).
- [x] Manuale: creare/salvare/riaprire una single send (anteprima persistita) e inviare/schedulare verificando il preheader.
- [x] `npm run lint` e `npx tsc --noEmit` puliti.

## Comments

Delivered (commit `b49c047`):

- `prisma/schema.prisma`: `EmailSingleSend.previewText String?` + migrazione; `EmailTemplate` invariato.
- `single-sends/schemas.ts`: `previewText: z.string().optional()` su insert/update; `procedures.ts` lo persiste in `create` e lo restituisce via `getOne`/`getMany` (update già lo propaga con lo spread `...input`).
- `mails/lib/types.ts`: `EmailProviderAdapter.sendBulk` acquisisce `previewText?: string`; `resend-adapter.ts` lo inoltra a `resendClient.broadcasts.create` (`previewText: previewText || undefined`).
- `send-single-send.ts`: passa `previewText: singleSend.previewText ?? undefined` a `sendBulk` (stesso percorso per invio immediato e schedulato).
- `write-form.tsx`: input "Preview text (optional)" sotto il Subject, incluso in `values` e nel payload di `update`, con hint e warning non bloccante oltre 100 caratteri.
- Coverage: `resend-adapter.test.ts` (passthrough a `broadcasts.create`), `send-single-send.test.ts` (valore presente/assente), `single-sends/server/__tests__/preview-text.test.ts` (round-trip create → getOne).
- Verified: `npx tsc --noEmit` pulito; test del modulo verdi (`single-sends` + `lib/adapters`: 4 file, 31 test).
