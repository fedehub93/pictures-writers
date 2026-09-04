# 03: Rendere il calendario range-based e consultabile

**What to build:** permettere all’editor di consultare in un unico calendario le Scheduled action dei Post, gli eventi completati e lo storico dei Post pubblicati, senza essere limitato dalla paginazione della lista Post.

**Blocked by:** None (Ticket 02: Portare la Scheduled publication dei Post su ScheduledAction risolto)

**Status:** resolved

- [x] Il calendario recupera gli eventi in base all’intervallo visibile invece di utilizzare la pagina corrente della lista Post.
- [x] L’intervallo è trattato come `[from, to)` e include correttamente gli eventi sui limiti.
- [x] Gli eventi sono restituiti in un formato normalizzato indipendente dal modello Post.
- [x] Il calendario mostra Scheduled action future, completate, fallite e annullate.
- [x] Gli eventi overdue sono identificabili visivamente.
- [x] Il calendario distingue l’orario pianificato dall’orario effettivo di esecuzione.
- [x] Lo storico include i Post pubblicati manualmente quando non esiste una ScheduledAction corrispondente.
- [x] Un Post pubblicato tramite scheduler non viene mostrato due volte nello storico.
- [x] L’editor può filtrare gli eventi per tipo di azione e stato operativo.
- [x] Gli eventi utilizzano il timezone del browser per l’inserimento e la visualizzazione delle date.
- [x] Le date vengono visualizzate correttamente sia per eventi futuri sia per eventi storici privi di orario schedulato.
- [x] Il calendario continua a permettere l’apertura del Post o dell’azione associata dal relativo evento.
- [x] Sono presenti test sulla query per intervallo, sui filtri, sui duplicati, sui confini temporali e su un numero di eventi superiore alla precedente page size.

## Comments

Implementato e verificato (commit `09b3393`, `8a8ab85`, `988764c`).

- Query range-based `getCalendarEvents` in `src/modules/scheduler/lib/calendar-query.ts` con intervallo half-open `[from, to)`, eventi normalizzati (`CalendarEvent`), deduplicazione delle pubblicazioni scheduler, e storici manuali. Router tRPC `scheduler.getCalendarEvents` collegato in `_app.ts`.
- UI: calendario in `src/modules/scheduler/ui/` (calendar, post-calendar, toolbar) con filtri per tipo azione e stato, timezone browser, distinzione planned/executed, overdue evidenziati, tooltip con dettagli e colori per stato sul bordo.
- Timezone del browser persistita sulle ScheduledAction (creazione/schedulazione/rischedulazione post); picker tempo unificato 24h.
- Test in `src/modules/scheduler/lib/__tests__/calendar-query.test.ts`: intervallo, confini, filtri (tipo, stato, PUBLISHED sintetico), duplicati, overdue, metadati e numero di eventi superiore alla page size.
- Suite completa verde: 79/79 test. Messa in sicurezza l’infrastruttura dei test (`TEST_DATABASE_URL`/`.env.test`): la suite non può più toccare il DB di sviluppo/produzione.
