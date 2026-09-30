# 03: Nodo Send Email — tipo di email e guardia di consenso

**What to build:** Il nodo Send Email acquisisce un campo `purpose` (`marketing` | `transactional`, default `marketing`), selezionabile nel pannello di configurazione del nodo. Per `marketing`, se il destinatario è un Contact noto con consenso revocato, l'invio viene **saltato** (nessuna email, Step non marcato come fallito). Per `transactional`, l'invio avviene sempre e senza guardia. Il motore non conosce il campo: resta configurazione di dominio del modulo mails (ADR-0005).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Il pannello del nodo espone un selettore "Tipo di email" con default `marketing`.
- [ ] `purpose` assente è trattato come `marketing`.
- [ ] `marketing` + Contact con consenso revocato → invio saltato (nessuna chiamata al transport, nessun log di invio, Step non fallito).
- [ ] `marketing` + Contact con consenso presente, oppure destinatario non presente tra i Contact → invio normale.
- [ ] `transactional` → invio sempre, anche verso un Contact con consenso revocato.
- [ ] Test al seam di `sendAutomationEmail` (transport iniettato) per i casi sopra.
