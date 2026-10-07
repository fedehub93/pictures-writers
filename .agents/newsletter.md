# Newsletter — Pictures Writers (esecuzione S4)

**Document version:** v1
**Last updated:** 2026-10-02
**Status:** workstream operativo — broadcast settimanale

Esecuzione del flusso **S4** progettato in `.agents/emails.md` §7. Qui vivono il playbook operativo e le issue scritte (a differenza di `emails.md`, che resta il design delle sequence).

## 1. Contesto e decisioni

- Canale **owned**, ~800 iscritti; ultimo invio 2-3 mesi fa → serve una fase di **riattivazione**, non solo ripresa.
- **Laboratori:** finestra iscrizioni **8 → 27 ottobre** (gruppo + 1:1, 300€), avvio **3 novembre**. Il gruppo riapre come sempre; l'1:1 è il nuovo formato. Vedi `.agents/launch-individuale.md`.
- **Cadenza decisa:** settimanale (lun), formato alternato **piena/leggera**, **+ invii a scadenza al bisogno** (apertura, ultima chiamata).
- **Deliverability:** dopo un silenzio lungo, ripartire con contenuto di valore. La **Issue 1 (lun 5) è ritorno soft** (nessuna vendita); l'**apertura iscrizioni è un'email separata** (Extra, gio 8). Monitorare bounce/spam.

## 2. Playbook operativo

**Costruzione di una issue "piena":**
1. **Pillola di tecnica** — 1 concetto + 1 esempio.
2. **Un'analisi Pagina Uno** — film diverso a rotazione.
3. **Una scadenza concorsi** (nei periodi concorsi).
4. **CTA di fondo** (rotazione): laboratorio / editing / ebook.

**Issue "leggera":** 1 sola risorsa forte + 1 riga, **un solo link**.

**Regole di scrittura:** apertura `Ciao,` + firma `A presto, il team di Pictures Writers`; **voce al plurale** (noi / abbiamo, mai io / ho); blocchi corti (mobile); CTA-bottone ≲20-22 caratteri; un solo CTA primario; oggetto e preview complementari (non ripetuti); ogni email self-contained; **frase ispirazionale di chiusura** dopo il CTA (una riga che riprende il tema e rilancia, prima della firma).

**Segmentazione:** stessa email per tutti, ma CTA di fondo differenziato per audience: `fans` (già clienti) vs `lead` (mai acquistato).

**Checklist pre-invio:** link verificati (no 404) · UTM `utm_source=email&utm_medium=newsletter&utm_campaign=NN-YYYY` · footer unsubscribe funzionante · `List-Unsubscribe` (broadcast Resend) · test mobile.

**Tooling:** `EmailSingleSend` programmata via scheduler (`SEND_EMAIL`) sull'audience newsletter.

## 3. Ottobre 2026 — riattivazione + apertura laboratori

> **Finestra iscrizioni:** gio 8 → mar 27 ottobre. **Avvio laboratori:** mar 3 novembre.
> **Invii:** lun 5 (Issue 1, ritorno soft) · gio 8 (Extra, apertura iscrizioni) · lun 12 (Issue 2) · lun 19 (Issue 3) · gio 22 (Issue 4, ultima chiamata).
> Calendario di riferimento: `.agents/content-strategy.md` §4 (Trimestre 1, Ott-Dic 2026).

### Issue 1 — Ritorno / riattivazione (il soggetto è il vero lavoro) ✅ scritta
**Send:** lunedì 5 ottobre
**Oggetto:** Il problema non è la sceneggiatura
**Preview:** È il soggetto. E lì si decide più di metà del lavoro.
**Body:**
> Ciao,
> è da un po' che non ti scriviamo.
> Colpa nostra, non tua.
>
> In questi mesi non siamo stati fermi: nuove analisi, guide aggiornate, i prossimi laboratori in preparazione.
>
> **Da oggi si riprende, ogni settimana.**
>
> - un concetto da usare subito
> - un'analisi di una sceneggiatura
> - una scadenza che conta
>
> Niente riempitivi.
>
> Ripartiamo da un equivoco che vediamo continuo.
>
> Si pensa che il problema sia scrivere la sceneggiatura.
> Non è così.
>
> Il problema è il **soggetto**.
>
> Se il soggetto è solido, con protagonista, conflitto e finale, la sceneggiatura parte già con metà del lavoro fatto.
> Se il soggetto è debole, nessuna scrittura lo salva.
>
> **[Parti dal soggetto →]** `/come-scrivere-un-soggetto-cinematografico/`
>
> Giovedì ti scriviamo di nuovo: c'è una novità.
>
> A presto,
> il team di Pictures Writers
**CTA:** Parti dal soggetto → `/come-scrivere-un-soggetto-cinematografico/`
**Nota:** ritorno soft, nessuna vendita (regola playbook: valore prima della richiesta). Posiziona il soggetto come "il vero lavoro" e prepara l'offerta dell'Extra (gio 8). La riga "Giovedì... una novità" è il ponte all'apertura: toglierla se non si vuole pre-annunciare.

### Issue 2 — Il secondo atto (analisi Little Miss Sunshine) ✅ scritta
**Tipo:** piena · **Send:** lunedì 12 ottobre
**Oggetto:** Il secondo atto è dove muoiono le storie
**Preview:** Il primo atto si scrive da sé, il finale lo sogni. È il mezzo che affonda.
**Body:**
> Ciao,
> il primo atto è facile da amare. Il finale ce l'hai già in testa.
> Nel mezzo, quasi tutti si perdono.
>
> Il secondo atto è metà film. Ed è la parte che cede più spesso:
> - il protagonista smette di avere un obiettivo chiaro
> - le scene si susseguono senza far girare la storia
> - l'energia cala proprio dove dovrebbe salire
>
> Di solito non è colpa delle idee. È che il secondo atto ha una struttura precisa, e va riconosciuta prima di scriverla. Vale già a monte, quando il soggetto è ancora in piedi.
>
> La vediamo al lavoro in un film che conosci: smontiamo il secondo atto di **Little Miss Sunshine**, scena per scena, e capiamo perché regge fino al finale.
>
> **[Leggi la scomposizione →]** `/scomporre-il-secondo-atto-little-miss-sunshine/`
>
> Intanto, i laboratori sono aperti fino al 27 ottobre: [scopri come funzionano](/shop/corsi-di-sceneggiatura/).
>
> Il secondo atto è dove si decide se quella storia arriverà mai alla fine.
>
> A presto,
> il team di Pictures Writers
**CTA:** Leggi la scomposizione → `/scomporre-il-secondo-atto-little-miss-sunshine/`
**Nota:** l'articolo della scomposizione del secondo atto è già live. CTA allineata al tema della pillola (struttura del secondo atto) tramite la serie Pagina Uno: era il punto debole della versione sui tre documenti, che rimandava a Pagina Uno senza collegamento.

### Issue 3 — 5 errori che rovinano una sceneggiatura ✅ scritta
**Tipo:** piena · **Send:** lunedì 19 ottobre
**Oggetto:** 5 errori che rovinano una sceneggiatura (e come evitarli)
**Preview:** Non sono di stile: sono di struttura. E si vedono già a pagina uno.
**Body:**
> Ciao,
> gli errori che affondano una sceneggiatura raramente sono di stile. Sono di struttura, e si vedono presto:
>
> 1. **Protagonista senza obiettivo** — senza un "vuole" chiaro, non c'è storia.
> 2. **Conflitto troppo debole** — se nessuno si oppone davvero, non c'è tensione.
> 3. **Scena senza svolta** — ogni scena deve cambiare qualcosa, o non serve.
> 4. **Spiegare invece di mostrare** — i dialoghi che dicono tutto tolgono il cinema.
> 5. **Finale che non risponde alla domanda iniziale** — la promessa dell'inizio va mantenuta.
>
> Riconoscerli è il primo passo per non commetterli. Il secondo è far leggere il tuo lavoro a chi sa vederli.
>
> **[Richiedi il feedback gratuito →]** `/feedback-gratuito-sceneggiatura/`
>
> A volte non serve riscrivere tutto. Serve qualcuno che ti dica da dove ripartire.
>
> A presto,
> il team di Pictures Writers
**CTA:** Richiedi il feedback gratuito → `/feedback-gratuito-sceneggiatura/`
**Nota:** l'articolo "10 errori..." del calendario **non è ancora live** → l'issue è self-contained (5 errori invece di 10, per stare in email).

### Issue 4 — Ultima chiamata (a scadenza) ✅ scritta
**Tipo:** leggera · **Send:** giovedì 22 ottobre
**Oggetto:** Ultimi giorni per i laboratori
**Preview:** Le iscrizioni chiudono martedì 27. Il 3 novembre si parte.
**Body:**
> Ciao,
> le iscrizioni al laboratorio chiudono **martedì 27 ottobre**. Il **3 novembre** si parte.
>
> Se stai rimandando, questo è il momento.
>
> Un percorso a tappe, con una classe e un ritmo condiviso.
> Non serve un copione già scritto: si parte dall'idea.
>
> **[Iscriviti al laboratorio →]** `/shop/corsi-di-sceneggiatura/`
>
> Un'idea tenuta nel cassetto non diventa mai un film.
>
> A presto,
> il team di Pictures Writers
**CTA:** Iscriviti ai laboratori → `/shop/corsi-di-sceneggiatura/`
**Nota:** invio a scadenza, fuori dalla cadenza del lunedì, per lasciare giorni di margine prima della chiusura (27). La versione precedente (pre-annuncio a fine ottobre) non reggeva la finestra iscrizioni 8-27.

### Extra — Apertura iscrizioni laboratori ✅ scritta
**Tipo:** speciale (a scadenza) · **Send:** giovedì 8 ottobre
**Oggetto:** Sono aperte le iscrizioni ai laboratori
**Preview:** Si parte il 3 novembre. Iscrizioni fino al 27.
**Body:**
> Ciao,
> da oggi sono aperte le iscrizioni al laboratorio di scrittura del soggetto.
>
> Un percorso a tappe, con una classe e un ritmo condiviso.
> Non serve un copione già scritto: si parte dall'idea.
>
> Si parte il **3 novembre**. Le iscrizioni chiudono il **27 ottobre**.
>
> **[Scopri il laboratorio →]** `/shop/corsi-di-sceneggiatura/`
>
> Un soggetto scritto è già una storia. Il resto viene dopo.
>
> A presto,
> il team di Pictures Writers
**CTA:** Scopri il laboratorio → `/shop/corsi-di-sceneggiatura/`
**Nota:** apertura iscrizioni **solo gruppo** (finestra 8-27 ott, avvio 3 nov). Email self-contained: non rimanda alla Issue 1. Il formato 1:1 **non entra qui**: diventerebbe confusante (stesso prezzo, stesso esito) → ha una send dedicata a offerta unica dopo la finestra (vedi sotto).

### Send 1:1 — Lancio Laboratorio 1:1 ✅ scritta
**Tipo:** speciale a scadenza · **Send:** dopo la finestra del gruppo (post 27/10, es. mer 28 o gio 29)
**Oggetto:** Il laboratorio con una sola persona
**Preview:** Non era previsto. È andata benissimo. Ora è una scelta.
**Body:**
> Ciao,
> c'è un'edizione del nostro laboratorio che è finita con una sola persona.
>
> Non era previsto. Ma quella persona si è trovata benissimo: attenzione totale, ritmo suo, domande dirette, niente attese.
>
> Abbiamo capito una cosa: quel formato non era un caso. Era un modo di lavorare migliore, per chi lo vuole.
>
> Così l'abbiamo reso intenzionale: il **Laboratorio 1:1**, il laboratorio del soggetto con i **due consulenti** solo per te.
>
> - due consulenti dedicati, non uno, solo sulla tua idea
> - stesso metodo del corso di gruppo
> - stesso risultato: un soggetto di lungometraggio alla terza stesura
> - 5 sessioni, una a settimana
> - l'orario lo concordiamo insieme, sessione per sessione
> - prenoti con un form
>
> La differenza non è cosa impari. È quanta attenzione è tutta sulla tua idea.
> Stesso prezzo del corso di gruppo: 300€.
>
> **[Scopri il Lab 1:1 →]** `/shop/laboratorio-individuale/`
>
> Si parte il **10 novembre**. I posti sono **5**.
>
> Un'idea che non condividi con nessuno resta solo tua. Uno spunto che lavori con qualcuno diventa una storia.
>
> A presto,
> il team di Pictures Writers
**CTA:** Scopri il Lab 1:1 → `/shop/laboratorio-individuale/`
**Nota:** send separata e a **offerta unica** (mai "gruppo o 1:1" nella stessa email). Angolo = l'edizione del gruppo finita con una sola persona, andata bene. Avvio 10/11, 5 posti. **Bloccata dalla creazione della product page** (il link CTA deve essere live prima dell'invio).

### Avvio (extra del 3 novembre)
Email di benvenuto/conferma agli iscritti (dettagli prima sessione, come accedere), derivabile dalla conferma acquisto in `.agents/launch-individuale.md` §8.

**Sondaggio → social (non email):** lo speciale "Sondaggio sceneggiatura italiana 2026" (calendario `content-strategy` §4) si sposta **sui social** (poll/domande), più adatto al canale. I risultati diventano una **newsletter di dicembre** ("Cosa pensano gli sceneggiatori italiani"): contenuto di valore + prova di community.

## 4. Novembre 2026 — avvio laboratori

- **Finestra iscrizioni:** 8 → 27 ottobre (chiusa prima dell'avvio). L'apertura è l'**Extra** di ottobre (gio 8), non un'email di novembre.
- **Avvio:** 3 novembre.
- **Prezzi:** 300€ per entrambi (gruppo e 1:1). La differenza tra i due è il **formato** (collettivo vs 1:1), non il prezzo. Vedi `.agents/launch-individuale.md` §7.
- **Pre-annuncio:** saltato (l'apertura è l'Extra di gio 8); eventuale teaser social nel weekend.
- **Arco 1:1:** il copy di `.agents/launch-individuale.md` §8 (pre-annuncio → early-bird → ultima chiamata → conferma) non serve per questa finestra a canale unico; resta per edizioni/coorti future o per una gestione a lista d'attesa.
- **Gruppo:** riapertura comunicata nell'Extra di apertura (gio 8, apertura congiunta gruppo + 1:1).

## 5. Changelog
- v1 (2026-10-02) — Aperto il workstream newsletter. Contesto (silenzio 2-3 mesi, rilancio novembre), playbook operativo, piano ottobre (4 issue settimanali) e Issue 1 scritta; novembre in attesa della scala prezzi.
- v2 (2026-10-02) — **Voce e firma:** firma newsletter = `il team di Pictures Writers`, voce al **plurale** (noi/abbiamo); Issue 1 riallineata. **Prezzi:** laboratori allineati a **300€** (gruppo e 1:1), novembre sbloccato.
- v3 (2026-10-02) — **Issue 2-4 scritte** (self-contained: gli articoli del calendario "Differenza soggetto/trattamento/scaletta" e "10 errori" non sono ancora live). Sondaggio spostato **ai social**, risultati in una newsletter di dicembre. Novembre: pre-annuncio (Issue 4) + email di apertura (extra). Voce plurale e firma `il team di Pictures Writers`.
- v4 (2026-10-02) — **Issue 1 ricentrata sul soggetto.** CTA cambiata dall'hub `come-scrivere-una-sceneggiatura` (stesso link di S1-E1/S2-E1, contenuto da principianti assoluti) allo spoke **`come-scrivere-un-soggetto-cinematografico`**, con hook opinionato: "il problema non è la sceneggiatura, è il soggetto — e lì si decide più di metà del lavoro". Motivi: prova il momentum (invece di rimandare alla porta d'ingresso), alza il livello per una lista che include professionisti, e aggancia la conversione primaria (laboratorio del soggetto) + il pre-annuncio di novembre. Aggiunta riga di raccordo alla Issue 2 come **teaser morbido** ("il passo che viene subito dopo il soggetto"), non come indice: comunica il ritmo senza vincolare la settimana successiva. La Issue 2 resta invariata.
- v5 (2026-10-02) — **Issue 1 alleggerita per mobile:** il blocco apertura (silenzio + "in questi mesi" + promessa settimanale) era un muro di testo, spezzato in blocchi da 1-2 righe; la promessa di formato ("un concetto / un'analisi / una scadenza") resa in **bullet**; il claim centrale diviso in righe corte ("Se è solido… / Se è debole…"). Nessun cambio di oggetto, preview o CTA.
- v6 (2026-10-02) — **Issue 2 riscritta: dal tema "tre documenti" al secondo atto.** La versione precedente spiegava la differenza soggetto/trattamento/scaletta ma chiudeva su Pagina Uno, un non-sequitur (un'analisi di sceneggiatura finita non mostra i documenti a monte). Nuovo tema: pillola sulla **struttura del secondo atto** (la parte che cede più spesso) + analisi **Little Miss Sunshine** come prova concreta, CTA a `/scomporre-il-secondo-atto-little-miss-sunshine/` (live). Testo reso in voce umana e senza trattini lunghi. La riga di raccordo della Issue 1 va riallineata a mano (a cura dell'utente).
- v7 (2026-10-02) — **Frase ispirazionale di chiusura dopo il CTA.** Aggiunta una riga motivazionale dopo il bottone e prima della firma su Issue 2 (`Il secondo atto è dove si decide se quella storia arriverà mai alla fine.`), Issue 3 (`A volte non serve riscrivere tutto. Serve qualcuno che ti dica da dove ripartire.`) e Issue 4 (`Un'idea tenuta nel cassetto non diventa mai un film.`). Convenzione codificata nel playbook §2. Issue 1 lasciata all'utente.
- v8 (2026-10-02) — **Ottobre ricalendarizzato sulla finestra iscrizioni 5-27 (avvio 3/11).** Il pre-annuncio a fine ottobre era incompatibile con la chiusura del 27. Nuovo piano: **Issue 1 (lun 5) = ritorno + apertura iscrizioni**, Issue 2 (lun 12) valore + richiamo finestra aperta, Issue 3 (lun 19) valore, **Issue 4 (gio 22) = ultima chiamata** a scadenza (fuori cadenza del lunedì per dare margine). Aggiunta email di avvio 3/11 e opzione teaser social nel weekend. Issue 1 riscritta (ruolo cambiato da ritorno soft ad apertura): hook "il soggetto è il vero lavoro" mantenuto come lead-in dell'offerta. Aggiornati §1, §3, §4.
- v10 (2026-10-06) — **1:1 fuori dalla finestra del gruppo.** L'**Extra di gio 8 diventa a offerta singola sul gruppo** (rimosso l'1:1: stesso prezzo/stesso esito creava confusione); **Issue 4** allineata (niente "in gruppo / 1:1"). Il **Laboratorio 1:1** ha ora una **send dedicata a offerta unica** post-finestra (oggetto "Il laboratorio con una sola persona"), lancio diretto con avvio **10/11** e 5 posti; angolo = l'edizione del gruppo finita con una sola persona; **i due consulenti** sono il differenziatore. Blocco: creazione della product page. Vedi `.agents/launch-individuale.md` v4-v6.
- v9 (2026-10-02) — **Ritorno e apertura separati: Issue 1 (lun 5) soft + Extra apertura (gio 8).** Applicata la regola playbook "valore prima della richiesta": la Issue 1 torna a essere **ritorno soft, senza vendita** (CTA all'articolo sul soggetto), l'apertura iscrizioni diventa l'**Extra di giovedì 8** ("da oggi aperte, fino al 27, si parte il 3/11"), self-contained. Finestra iscrizioni 8→27. Ponte tra le due: riga "Giovedì ti scriviamo di nuovo: c'è una novità" in Issue 1. Rimosso il pre-annuncio (ora superfluo: la Issue 1 lo fa in forma soft). Issue 2-4 invariate. Aggiornati §1, §3, §4.
