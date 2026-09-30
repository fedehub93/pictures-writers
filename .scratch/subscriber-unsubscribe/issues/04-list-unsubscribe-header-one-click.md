# 04: Header `List-Unsubscribe` e endpoint one-click

**What to build:** Per le email `marketing`, i send di sequenza portano gli header `List-Unsubscribe` e `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, puntati a una route interna dell'app. Il pulsante nativo "Annulla iscrizione" del client di posta revoca il consenso; un `GET` reindirizza alla pagina pubblica di conferma. Le email `transactional` non portano alcun header. Gli header viaggiano attraverso il tipo email generico e gli adapter del provider. Se `NEXT_PUBLIC_APP_URL` non è configurata, gli header sono omessi senza errori (il footer del template resta funzionante).

**Blocked by:** 01 (revoca del consenso dietro un'unica funzione), 03 (tipo di email sul nodo)

**Status:** ready-for-agent

- [ ] Il tipo email generico supporta `headers`; gli adapter provider li inoltrano al canale transazionale.
- [ ] `marketing` + Contact + URL configurata → header presenti, con URL `${NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe/?id=<contactId>`.
- [ ] `transactional` → nessun header.
- [ ] `NEXT_PUBLIC_APP_URL` assente → nessun header e nessun errore.
- [ ] `POST /api/newsletter/unsubscribe?id=<id>` revoca il consenso e risponde 2xx, anche se la sincronizzazione col provider fallisce.
- [ ] `GET /api/newsletter/unsubscribe?id=<id>` reindirizza alla pagina pubblica di conferma.
- [ ] Test Seam 1 (header su `sendAutomationEmail` con transport iniettato) + smoke della route: `POST` senza id → 400; `POST` con id valido → 2xx e consenso revocato; `GET` → redirect.
