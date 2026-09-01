# 02: Gestire il ciclo di vita della Scheduled publication

**What to build:** permettere a un editor di schedulare, modificare, reschedulare, annullare o pubblicare immediatamente un Post dal pannello di amministrazione, mantenendo online la versione pubblica corrente fino alla pubblicazione della versione futura.

**Blocked by:** None

**Status:** resolved

- [x] Un Post `DRAFT` o `CHANGED` valido può essere portato allo stato `SCHEDULED`.
- [x] Il Post conserva una data di Scheduled publication nullable e una schedulazione attiva per ogni Post/root.
- [x] Una data nel passato viene rifiutata sia dall’interfaccia sia dal livello applicativo.
- [x] Il dialog di scheduling interpreta data e ora nella timezone del browser.
- [x] Il selettore dell’orario usa intervalli di cinque minuti.
- [x] Il valore scelto viene salvato come istante assoluto, senza rendere permanente la timezone del browser.
- [x] Modificare un Post `SCHEDULED` aggiorna la stessa versione futura e non crea versioni schedulate concorrenti.
- [x] È possibile modificare la data e l’ora di una Scheduled publication esistente.
- [x] Annullare la schedulazione ripristina `DRAFT` per un Post mai pubblicato e `CHANGED` per una modifica a un Post precedentemente pubblico.
- [x] Un Post pubblicato precedentemente resta la versione visibile pubblicamente mentre la nuova versione è `SCHEDULED`.
- [x] L’azione “Publish now” pubblica subito la versione schedulata e rimuove la schedulazione pendente.
- [x] La schedulazione è disponibile solo per Post `DRAFT` e `CHANGED`; la pubblicazione manuale esistente continua a funzionare.
- [x] La lista dei Post mostra il badge `Scheduled`, la data/ora prevista e un filtro per `SCHEDULED`.
- [x] La lista e il dettaglio mostrano azioni coerenti con lo stato corrente: scheduling, rescheduling, cancellazione e pubblicazione immediata.
- [x] Le query, le procedure e i tipi client rappresentano correttamente `SCHEDULED` e la data prevista.
- [x] I Post `SCHEDULED` non vengono esposti dalle query pubbliche che mostrano solo contenuti pubblicati.
- [x] Sono presenti test di integrazione sul ciclo completo di scheduling, modifica, annullamento e pubblicazione immediata.
- [x] I test usano il database già configurato nel file `.env` come database di test del progetto.
- [x] Le migration necessarie vengono eseguite su quel database prima dei test.
- [x] I test verificano anche che la versione pubblica corrente rimanga invariata prima della pubblicazione futura.
- [x] Il lint e gli altri controlli di validazione disponibili nel progetto restano verdi.

## Comments

Implemented in the same commit as the schema migration.

- Added `SCHEDULED` to `ContentStatus` and `scheduledAt`/`preSchedulingStatus` to `Post`.
- Added shared `schedulePost`, `reschedulePost`, `cancelSchedule` workflows with root-level locking.
- Extended `publishPost` to publish `SCHEDULED` posts and clear scheduling state.
- Added tRPC mutations `schedule`, `reschedule`, `cancelSchedule` and updated `getMany`/`getLastByRootId`.
- Added admin UI: schedule dialog with browser-local date/time picker and 5-minute time steps, Scheduled badge/column/filter, single Actions dropdown in post detail.
- Added integration tests covering scheduling, rescheduling, editing the same scheduled version, cancellation, immediate publication, and public-visibility preservation.

Note: `npm run lint` is still blocked by pre-existing toolchain errors unrelated to this feature. `npx tsc --noEmit` and the test suite are green.
