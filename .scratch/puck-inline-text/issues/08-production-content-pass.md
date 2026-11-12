# 08: Passaggio manuale sui blocchi Text in produzione

**What to build:** Dopo il deploy, riscrivere a mano i blocchi `Text` esistenti che oggi vivono dei
newline e della resa `whitespace-pre-line`. I valori continuano a leggersi — una stringa senza tag
diventa un paragrafo e i newline restano visibili grazie a `white-space: pre-wrap` — quindi questa
non è una migrazione: è una revisione di qualità, perché il testo sarà ora modificabile e
formattabile, e i paragrafi veri sono migliori delle righe spezzate. Nello stesso passaggio si
controllano gli heading esistenti: il tag predefinito è `h2`, quindi una pagina il cui titolo di
sezione era il blocco `Heading` va verificata (e l'H1 della pagina non deve finire nel builder).

**Blocked by:** 07

**Status:** ready-for-human

**Skills:** —

- [ ] Elencare le pagine pubbliche che contengono un blocco `Text` (e i documenti delle Site region).
- [ ] Riscrivere i blocchi `Text` che dipendono dai newline: paragrafi veri, liste dove serve,
      heading interni dove il testo lo merita.
- [ ] Verificare i blocchi `Heading`: livello corretto, un solo `h1` per pagina, nessun titolo
      lasciato vuoto.
- [ ] Verificare che i grassetti e i link già presenti negli heading esistenti siano ancora lì.
- [ ] Ripubblicare le pagine toccate e confrontare canvas e pagina pubblicata.
- [ ] Annotare alla spec eventuali casi che il passaggio manuale ha rivelato e che meritano un
      ticket.

## Notes

- Il numero di blocchi coinvolti è piccolo, per questo la spec non prevede uno script.
- Se durante il passaggio emergono contenuti con HTML non normalizzato (per esempio incollati da
  un altro CMS), fermarsi: è il segnale che l'assunzione "contenuto fidato" di ADR-0041 ha bisogno
  di un sanitizer.
