# 01: Revoca del consenso dietro un'unica funzione

**What to build:** Una funzione server unica che revoca il consenso di un Contact (`isSubscriber = false`), **mantiene la riga Contact** (il consenso si revoca, non si cancella), e sincronizza il provider in best-effort (errori loggati, mai propagati). Ritorna `false` se il Contact non esiste ed è idempotente. La server action pubblica di disiscrizione (`/rimuovi-sottoscrizione`) diventa un thin wrapper su questa funzione, con lo stesso contratto di ritorno (`{ error }` / `{ success }`). È il prefactor che prepara i ticket successivi.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Esiste una funzione server unica di revoca che imposta `isSubscriber = false` senza cancellare la riga Contact.
- [ ] Gli errori di sincronizzazione col provider non sono propagati: la revoca riesce comunque.
- [ ] Una seconda chiamata per lo stesso id è idempotente (nessun errore).
- [ ] Id inesistente → ritorna `false`.
- [ ] La pagina pubblica `/rimuovi-sottoscrizione` continua a comportarsi identicamente (il Contact resta, il consenso è revocato).
- [ ] Test al seam della funzione (DB di test + adapter provider mockato): revoca, tolleranza agli errori del provider, idempotenza, id inesistente.
