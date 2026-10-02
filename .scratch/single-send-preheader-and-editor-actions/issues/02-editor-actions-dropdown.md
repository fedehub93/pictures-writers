# 02: Dropdown azioni negli editor (single send + template)

**What to build:** Le azioni degli header editor passano a `Save` primario +
menu "…" (`DropdownMenu` di `src/shared/ui/dropdown-menu.tsx`), con la stessa
convenzione visiva: kebab `Button variant="ghost" size="icon"` +
`MoreHorizontalIcon`, `DropdownMenuContent align="end"`.

- **Single send** (`write-form.tsx`): menu con `Send now`, `Schedule send`
  (oppure `Reschedule` + `Cancel schedule` quando esiste uno schedule attivo) e
  `Delete` distruttivo in fondo, dopo un separatore (`ConfirmModal` esistente).
  `onSend` continua a inviare la versione persistita: `Save` resta l'azione
  primaria.
- **Template** (`template-editor-form.tsx`): menu con `Delete` (`ConfirmModal`
  esistente); `Save` resta primario.

**Blocked by:** —

**Status:** resolved

- [x] Single send: `Save` primario + menu "…"; `Send now` disabilitato coerentemente con `isSubmitting`/`!isValid`.
- [x] Single send: stato senza schedule → `Schedule send`; stato con schedule → `Reschedule` + `Cancel schedule`.
- [x] Single send: `Delete` distruttivo in fondo, separato.
- [x] Template: `Save` primario + menu "…" con `Delete` distruttivo.
- [x] Manuale: entrambi gli stati dello schedule e i due editor; `npm run lint` pulito.

## Comments

Delivered:

- `single-sends/ui/components/write-form.tsx`: header con `Save` primario (`type="submit"`, `disabled={isSubmitting || !isValid}`) + kebab `Button variant="ghost" size="icon"` con `MoreHorizontalIcon` e `DropdownMenuContent align="end"`.
  - `Send now` → `onSend()` (continua a inviare la versione persistita), `disabled={isSubmitting || !isValid || sendIsPending}`.
  - Senza schedule: `Schedule send`; con schedule attivo: `Reschedule` (riusa `ScheduleSingleSendDialog` in `mode="reschedule"`) + `Cancel schedule` (`cancelSchedule`).
  - `DropdownMenuSeparator` + `Delete` distruttivo in fondo, riusando `ConfirmModal`.
  - I trigger dei dialog usano `DropdownMenuItem` con `onSelect={(e) => e.preventDefault()}`: il menu resta montato così il dialog portaled non viene smontato alla chiusura del menu (stessa meccanica del `ConfirmModal` esistente).
- `templates/ui/components/template-editor-form.tsx`: `Save` primario invariato + menu "…" con `Delete` distruttivo (`ConfirmModal`); spazio per un futuro `Duplicate`.
- Verified: `npx tsc --noEmit` pulito; test del modulo mails verdi; `eslint` sui due file non introduce nuovi problemi rispetto al baseline (restano solo i warning/error preesistenti sul file write-form, non toccati da questa slice).
