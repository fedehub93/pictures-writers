# 03: Rendere il calendario range-based e consultabile

**What to build:** permettere all’editor di consultare in un unico calendario le Scheduled action dei Post, gli eventi completati e lo storico dei Post pubblicati, senza essere limitato dalla paginazione della lista Post.

**Blocked by:** 02 — Portare la Scheduled publication dei Post su ScheduledAction

**Status:** ready-for-agent

- [ ] Il calendario recupera gli eventi in base all’intervallo visibile invece di utilizzare la pagina corrente della lista Post.
- [ ] L’intervallo è trattato come `[from, to)` e include correttamente gli eventi sui limiti.
- [ ] Gli eventi sono restituiti in un formato normalizzato indipendente dal modello Post.
- [ ] Il calendario mostra Scheduled action future, completate, fallite e annullate.
- [ ] Gli eventi overdue sono identificabili visivamente.
- [ ] Il calendario distingue l’orario pianificato dall’orario effettivo di esecuzione.
- [ ] Lo storico include i Post pubblicati manualmente quando non esiste una ScheduledAction corrispondente.
- [ ] Un Post pubblicato tramite scheduler non viene mostrato due volte nello storico.
- [ ] L’editor può filtrare gli eventi per tipo di azione e stato operativo.
- [ ] Gli eventi utilizzano il timezone del browser per l’inserimento e la visualizzazione delle date.
- [ ] Le date vengono visualizzate correttamente sia per eventi futuri sia per eventi storici privi di orario schedulato.
- [ ] Il calendario continua a permettere l’apertura del Post o dell’azione associata dal relativo evento.
- [ ] Sono presenti test sulla query per intervallo, sui filtri, sui duplicati, sui confini temporali e su un numero di eventi superiore alla precedente page size.
