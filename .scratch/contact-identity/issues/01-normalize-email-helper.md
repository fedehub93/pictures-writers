# 01: Normalizzatore dell'indirizzo canonico

**What to build:** Un unico punto di normalizzazione dell'indirizzo email, usato come identità del Contact: `trim` + lowercase, `null` per vuoto o solo whitespace, nessun'altra trasformazione. Deve essere l'unica funzione che il resto del sistema chiama per decidere "che indirizzo è questo", così che i percorsi di cattura non possano divergere.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Esiste `normalizeEmail(raw: string): string | null`: `trim()`, poi `toLowerCase()`; stringa vuota o solo whitespace → `null`
- [x] Nessuna trasformazione oltre al case: `+tag`, punti nel local part, Unicode/NFC, punycode restano intatti
- [x] Nessuna validazione di formato nella funzione: quella resta a Zod ai bordi
- [x] La funzione vive in un modulo condiviso raggiungibile sia dal codice server sia dagli helper `src/data/*`, senza dipendenze da Prisma
- [x] Test a tabella: spazi ai bordi, maiuscole miste, `""`, `"   "`, `"Mario+news@X.com"` → `"mario+news@x.com"`, stringa con non-ASCII invariata oltre al case

## Comments

Delivered:

- `src/shared/lib/email.ts` exports `normalizeEmail`: `trim().toLowerCase()`, `null` on empty/whitespace, nothing else. Pure module, no Prisma and no other imports, so both server code and `src/data/*` can import it via `@/shared/lib/email`.
- `src/shared/lib/__tests__/email.test.ts`: table of cases (edge whitespace incl. tabs/newlines, mixed case, `+tag`, Gmail dots, punycode, composed/decomposed Unicode, Cyrillic) plus `null` cases, no-format-validation and idempotence. 18 tests green.
- Wiring of the write/lookup paths is issue 02; this ticket only establishes the single choke point.
