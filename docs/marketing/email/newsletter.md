# Newsletter — Pictures Writers (esecuzione S4)

**Document version:** v12
**Last updated:** 2026-10-26
**Status:** workstream operativo — broadcast settimanale

Esecuzione del flusso **S4** progettato in `docs/marketing/email/emails.md` §7. Qui vivono il playbook operativo e le issue scritte (a differenza di `emails.md`, che resta il design delle sequence).

## 1. Contesto e decisioni

- Canale **owned**, ~800 iscritti; ultimo invio 2-3 mesi fa → serve una fase di **riattivazione**, non solo ripresa.
- **Laboratori:** finestra iscrizioni **8 → 27 ottobre** (gruppo + 1:1, 300€), avvio **3 novembre**. Il gruppo riapre come sempre; l'1:1 è il nuovo formato. Vedi `docs/marketing/launch/launch-individuale.md`.
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
> **Invii:** lun 5 (Issue 1, ritorno soft) · gio 8 (Extra, apertura iscrizioni) · lun 12 (Issue 2) · lun 19 (Issue 3) · gio 22 (Issue 4, ultima chiamata) · lun 26 (Issue 5, valore) · gio 29 (Extra, lancio 1:1).
> Calendario di riferimento: `docs/marketing/strategy/content-strategy.md` §4 (Trimestre 1, Ott-Dic 2026).

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

### Issue 5 — Cosa vuole il tuo protagonista ✅ scritta
**Tipo:** piena · **Send:** lunedì 26 ottobre
**Oggetto:** Cosa vuole il tuo protagonista?
**Preview:** Non cosa gli succede. Cosa vuole. È lì che si decide se la storia tiene.
**Body:**
> Ciao,
> c'è una domanda che facciamo sempre prima di leggere una sceneggiatura:
> cosa vuole il protagonista?
>
> Non cosa gli succede.
> Non cosa impara alla fine.
> Cosa vuole, in modo concreto, e cosa è disposto a perdere per ottenerlo.
>
> Senza un "vuole" chiaro la storia non parte.
> Con un "vuole" chiaro, ogni scena ha un motivo per esistere:
> - l'obiettivo dà direzione
> - l'ostacolo dà tensione
> - la posta in gioco dà peso a ogni scelta
>
> Si vede bene in un film che conosci: **Whiplash**.
> Andrew vuole diventare uno dei grandi. Fletcher è l'ostacolo. Il costo è tutto il resto: le relazioni, la salute, il suo stesso senso di sé.
> Il film regge perché ogni scena mette alla prova quel "vuole", fino all'ultima battuta.
>
> **[Leggi l'analisi →]** `/sceneggiatura-whiplash-pagina-uno/`
>
> Se non sai cosa vuole il tuo protagonista, non hai ancora una storia. Hai una situazione.
>
> A presto,
> il team di Pictures Writers
**CTA:** Leggi l'analisi → `/sceneggiatura-whiplash-pagina-uno/`
**Nota:** piena di solo valore, quattro giorni dopo l'ultima chiamata del gruppo. Non contiene vendita: prepara la send 1:1 di giovedì 29 (valore prima della richiesta). Nessuna scadenza concorsi verificata: la sezione scadenze resta fuori.

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
**Tipo:** speciale a scadenza · **Send:** giovedì 29 ottobre
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
> **[Scopri il Lab 1:1 →]** `/shop/laboratorio-individuale/laboratorio-1-1-soggetto/`
>
> Si parte il **10 novembre**. I posti sono **5**.
>
> Un'idea che non condividi con nessuno resta solo tua. Uno spunto che lavori con qualcuno diventa una storia.
>
> A presto,
> il team di Pictures Writers
**CTA:** Scopri il Lab 1:1 → `/shop/laboratorio-individuale/laboratorio-1-1-soggetto/`
**Nota:** send separata e a **offerta unica** (mai "gruppo o 1:1" nella stessa email). Angolo = l'edizione del gruppo finita con una sola persona, andata bene. Avvio 10/11, 5 posti. **Bloccata dalla creazione della product page e della categoria `laboratorio-individuale`** (il link CTA deve essere live prima dell'invio). **Audience:** `lead` (mai acquistato); escludere dall'invio chi ha già fatto il laboratorio di gruppo, se il segmento è tracciabile (gli ex-studenti hanno già svolto quel job).

**Sondaggio → social (non email):** lo speciale "Sondaggio sceneggiatura italiana 2026" (calendario `content-strategy` §4) si sposta **sui social** (poll/domande), più adatto al canale. I risultati diventano una **newsletter di dicembre** ("Cosa pensano gli sceneggiatori italiani"): contenuto di valore + prova di community.

## 4. Novembre 2026 — avvio laboratori e regime settimanale

> **Finestra gruppo:** chiusa il 27 ottobre. **Avvio gruppo:** 3 novembre.
> **Lancio 1:1:** giovedì 29 ottobre. **Avvio 1:1:** 10 novembre, 5 posti.
> **Cadenza:** lunedì, pieno/leggero alternati; extra a scadenza quando serve.

### Calendario

| Data | Tipo | Contenuto | CTA primaria |
|---|---|---|---|
| lun 26 ott | Piena | Cosa vuole il protagonista (Whiplash) | Leggi l'analisi |
| gio 29 ott | Speciale | Lancio Laboratorio 1:1 | Scopri il Lab 1:1 |
| lun 2 nov | Leggera | I tre atti, senza giri di parole | Rivedi i tre atti |
| mar 3 nov | Transazionale | Avvio gruppo, solo iscritti | — |
| gio 5 nov | Speciale | Ultima chiamata 1:1, solo se restano posti | Prendi il tuo posto |
| lun 9 nov | Piena | Beat, scena, sequenza (Squid Game) | Leggi la guida |
| lun 16 nov | Leggera | La prima pagina | Richiedi il feedback |
| lun 23 nov | Piena (facoltativa) | Il dialogo che dice troppo (Casablanca) | Mandaci il copione |

**Regole di questa finestra:**
- **Arco dei contenuti:** protagonista (5) → struttura (6) → beat/scena/sequenza (7) → prima pagina (8) → dialogo (9). Dal macro al micro; la micro-conversione (feedback) arriva solo alla issue 8, dopo tre invii di valore.
- **Issue 5:** è nel §3 perché cade ancora a ottobre; qui compare solo nel calendario.
- **Alternanza:** piena/leggera sulle issue del lunedì; le due speciali 1:1 (29/10 e 5/11) sono fuori cadenza e non contano nell'alternanza.
- **Nessuna scadenza concorsi:** per questa finestra non ci sono date verificate. Meglio un'email self-contained che una data sbagliata. Le scadenze tornano appena il calendario concorsi è aggiornato.
- **Segmentazione:** la CTA di fondo verso l'editing (issue 9) vale per `fans` e per chi ha già un testo; per il segmento `lead` va sostituita con il feedback gratuito (`/feedback-gratuito-sceneggiatura/`). Le issue 5, 6, 7 e 8 hanno CTA neutre (analisi, guida, feedback) e restano identiche per tutti.
- **Guardrail deliverability:** se l'unsubscribe della sequenza 26/10-29/10 supera lo 0,5%, annullare l'extra del 5/11 e tornare alla sola cadenza del lunedì. La lista è piccola: meglio perdere un promemoria che la reputazione del dominio.
- **Prezzi:** 300€ per entrambi (gruppo e 1:1). La differenza è il **formato** (collettivo vs 1:1), non il prezzo. Vedi `docs/marketing/launch/launch-individuale.md` §7.
- **Pre-annuncio:** saltato; l'apertura del gruppo è stata l'Extra di gio 8. Eventuale teaser social nel weekend.
- **Arco 1:1:** il copy di `docs/marketing/launch/launch-individuale.md` §8 (pre-annuncio → early-bird → ultima chiamata → conferma) non serve per questa finestra a canale unico; resta per edizioni/coorti future o per una gestione a lista d'attesa.
- **Gruppo:** riapertura comunicata nell'Extra di apertura (gio 8). L'avvio del 3/11 è transazionale, non newsletter.

### Issue 6 — I tre atti, senza giri di parole ✅ scritta
**Tipo:** leggera · **Send:** lunedì 2 novembre
**Oggetto:** I tre atti, senza giri di parole
**Preview:** Il primo giorno di laboratorio partiamo sempre da qui. Vale anche se non sei in laboratorio.
**Body:**
> Ciao,
> oggi una cosa sola, la più utile prima di iniziare una storia:
> la struttura in tre atti.
>
> Non è una formula da riempire.
> È il modo più rapido per capire se la tua idea ha un inizio, un conflitto e una fine, e se quel finale risponde alla domanda che hai posto all'inizio.
>
> Un concetto, esempi compresi.
> È da lì che partiamo sempre, anche in laboratorio.
>
> **[Rivedi i tre atti →]** `/la-struttura-in-tre-atti-di-una-sceneggiatura/`
>
> Una storia senza struttura non è libera. È solo dispersa.
>
> A presto,
> il team di Pictures Writers
**CTA:** Rivedi i tre atti → `/la-struttura-in-tre-atti-di-una-sceneggiatura/`
**Nota:** leggera, un solo link. Il giorno dopo parte il laboratorio di gruppo: l'email resta di valore e non chiede nulla a chi non è iscritto.

### Avvio 3 novembre (transazionale, non newsletter)
Email di benvenuto/conferma **solo agli iscritti al gruppo**: dettagli della prima sessione e come accedere. Derivabile dalla conferma acquisto (`webinarTemplateId`) e, per il formato 1:1, da `docs/marketing/launch/launch-individuale.md` §8. Non va all'audience newsletter.

### Extra — Ultima chiamata Laboratorio 1:1 (a scadenza) ✅ scritta
**Tipo:** speciale a scadenza · **Send:** giovedì 5 novembre
**Oggetto:** Ultimi posti per il Laboratorio 1:1
**Preview:** Si parte martedì 10. I posti sono cinque.
**Body:**
> Ciao,
> martedì 10 novembre parte il **Laboratorio 1:1**.
> Cinque posti. Cinque sessioni. I due consulenti solo sulla tua idea.
>
> Se stai aspettando il momento giusto, questo è il momento.
> I posti sono cinque: quando finiscono, finiscono.
>
> **[Prendi il tuo posto →]** `/shop/laboratorio-individuale/laboratorio-1-1-soggetto/`
>
> Un'idea che rimandi ancora un po' resta un'idea. Una che lavori con qualcuno diventa un soggetto.
>
> A presto,
> il team di Pictures Writers
**CTA:** Prendi il tuo posto → `/shop/laboratorio-individuale/laboratorio-1-1-soggetto/`
**Nota:** invio a scadenza, **solo se dopo la send del 29 restano posti**. Se l'edizione è esaurita, annullare. Non mescolare gruppo e 1:1. Stessa audience della send del 29 (`lead`, esclusi ex-studenti del gruppo).

### Issue 7 — Beat, scena, sequenza: non sono sinonimi ✅ scritta
**Tipo:** piena · **Send:** lunedì 9 novembre
**Oggetto:** Beat, scena, sequenza: non sono sinonimi
**Preview:** Tre livelli diversi. Confonderli blocca la storia senza che tu te ne accorga.
**Body:**
> Ciao,
> beat, scena e sequenza vengono usati come sinonimi. Non lo sono.
> Sono tre livelli diversi, e confonderli è uno dei motivi per cui una sceneggiatura sembra procedere senza andare da nessuna parte.
>
> - **Il beat** è il più piccolo cambiamento emotivo o decisionale dentro una scena. Un gesto, un'esitazione, una battuta che sposta l'equilibrio.
> - **La scena** è un'unità di tempo e spazio, e deve chiudersi con un cambio di valore. Se all'inizio e alla fine è tutto uguale, non è una scena.
> - **La sequenza** è un gruppo di scene che costruisce un arco più ampio e si chiude con una svolta.
>
> Si vede bene in **Squid Game**, nella regola del voto dopo ogni gioco: quel blocco è una sequenza. Dentro ci sono scene, come la discussione e i flashback, e beat, come un pulsante premuto in silenzio o una voce che si rompe. Ogni livello fa il suo lavoro.
>
> **[Leggi la guida →]** `/beat-scena-e-sequenza-in-sceneggiatura/`
>
> Il test rapido: se non sai dire cosa cambia tra l'inizio e la fine di una scena, non hai una scena. Hai un pezzo di dialogo.
>
> A presto,
> il team di Pictures Writers
**CTA:** Leggi la guida → `/beat-scena-e-sequenza-in-sceneggiatura/`
**Nota:** piena costruita intorno alla guida live su beat/scena/sequenza. Sostituisce la precedente Issue 7 ("La scena che non cambia niente", The Social Network): erano lo stesso territorio a due settimane di distanza, e la guida lo copre con più precisione, esempio incluso. Niente Pagina Uno in questa issue: l'analisi è dentro la guida (Squid Game). La CTA editing resta sulla Issue 9. CTA neutra, identica per `fans` e `lead`.

### Issue 8 — La prima pagina ✅ scritta
**Tipo:** leggera · **Send:** lunedì 16 novembre
**Oggetto:** La prima pagina basta?
**Preview:** Non deve spiegare tutto. Deve far venire voglia di leggere la seconda.
**Body:**
> Ciao,
> una cosa sola, oggi.
> La prima pagina non deve spiegare tutto.
> Deve far venire voglia di leggere la seconda.
>
> Se hai già una scena d'apertura, mandacela.
> La leggiamo come leggiamo i copioni che arrivano in studio e ti diciamo cosa funziona, cosa frena e da dove ripartire. Gratis.
>
> **[Richiedi il feedback →]** `/feedback-gratuito-sceneggiatura/`
>
> Una storia comincia quando qualcuno, dopo la prima pagina, vuole leggere la seconda.
>
> A presto,
> il team di Pictures Writers
**CTA:** Richiedi il feedback → `/feedback-gratuito-sceneggiatura/`
**Nota:** leggera, un solo link. Micro-conversione, non vendita. Riprende l'attrezzo intermedio della S1 (feedback sulla prima pagina).

### Issue 9 — Il dialogo che dice troppo (facoltativa) ✅ scritta
**Tipo:** piena · **Send:** lunedì 23 novembre
**Oggetto:** Il dialogo che dice troppo
**Preview:** Se il personaggio dice quello che pensa, il pubblico smette di ascoltare.
**Body:**
> Ciao,
> il dialogo non serve a spiegare. Serve a nascondere.
> Quando un personaggio dice esattamente quello che pensa, il pubblico smette di ascoltare: non c'è più niente da scoprire.
>
> Il sottotesto è la differenza tra una battuta scritta e una battuta che resta:
> - il personaggio dice una cosa e ne intende un'altra
> - l'ostacolo non è detto, è implicito
> - la tensione nasce da ciò che non viene detto
>
> **Casablanca** è il manuale: Rick e Ilsa parlano del passato senza dirlo mai per intero. Ogni battuta è una porta socchiusa, non una spiegazione.
> [Leggi l'analisi](/sceneggiatura-casablanca-pagina-uno/)
>
> Se vuoi lavorare sul dialogo del tuo copione, l'editing è il posto giusto:
>
> **[Mandaci il copione →]** `/shop/servizi-di-editing/sceneggiatura-di-lungometraggio/`
>
> Un dialogo forte non dice tutto. Lascia qualcosa fuori dalla porta.
>
> A presto,
> il team di Pictures Writers
**CTA:** Mandaci il copione → `/shop/servizi-di-editing/sceneggiatura-di-lungometraggio/`
**Nota:** piena, oltre metà novembre. CTA editing (per `lead`: feedback gratuito). Facoltativa: se il ritmo di produzione si allunga, slitta a dicembre senza rompere la cadenza.

## 5. Changelog
- v12 (2026-10-26) — **Issue 7 ricentrata sulla guida beat/scena/sequenza.** Sostituita "La scena che non cambia niente" (The Social Network) con una piena costruita intorno a `/beat-scena-e-sequenza-in-sceneggiatura/`: i tre livelli (beat, scena, sequenza), esempio Squid Game, CTA unica "Leggi la guida". Motivo: stesso territorio della vecchia issue a due settimane di distanza; la guida lo copre con più precisione e porta traffico a un articolo già live. La CTA editing si sposta sulla Issue 9; aggiornati calendario, arco dei contenuti e segmentazione.
- v11 (2026-10-26) — **Piano 26 ottobre → 23 novembre.** Aggiunte **Issue 5** (lun 26/10, piena: cosa vuole il protagonista, analisi Whiplash), **Issue 6** (lun 2/11, leggera: i tre atti, senza giri di parole), **Issue 7** (lun 9/11, piena: la scena che non cambia niente, The Social Network, CTA editing), **Issue 8** (lun 16/11, leggera: la prima pagina, feedback gratuito) e **Issue 9** (lun 23/11, piena facoltativa: il dialogo che dice troppo, Casablanca). Aggiunta l'**extra 1:1 di gio 5/11** (ultima chiamata, solo se restano posti) e fissata la **send 1:1 a gio 29/10** con link alla product page `/shop/laboratorio-individuale/laboratorio-1-1-soggetto/`. Alternanza piena/leggera rispettata; nessuna scadenza concorsi inventata; guardrail unsubscribe 0,5% sulla sequenza 26-29/10. La send 1:1 resta **bloccata** finché product page e categoria non sono live; audience `lead`, esclusi gli ex-studenti del gruppo. Rimosso il duplicato dell'email di avvio 3/11, ora solo transazionale.
- v1 (2026-10-02) — Aperto il workstream newsletter. Contesto (silenzio 2-3 mesi, rilancio novembre), playbook operativo, piano ottobre (4 issue settimanali) e Issue 1 scritta; novembre in attesa della scala prezzi.
- v2 (2026-10-02) — **Voce e firma:** firma newsletter = `il team di Pictures Writers`, voce al **plurale** (noi/abbiamo); Issue 1 riallineata. **Prezzi:** laboratori allineati a **300€** (gruppo e 1:1), novembre sbloccato.
- v3 (2026-10-02) — **Issue 2-4 scritte** (self-contained: gli articoli del calendario "Differenza soggetto/trattamento/scaletta" e "10 errori" non sono ancora live). Sondaggio spostato **ai social**, risultati in una newsletter di dicembre. Novembre: pre-annuncio (Issue 4) + email di apertura (extra). Voce plurale e firma `il team di Pictures Writers`.
- v4 (2026-10-02) — **Issue 1 ricentrata sul soggetto.** CTA cambiata dall'hub `come-scrivere-una-sceneggiatura` (stesso link di S1-E1/S2-E1, contenuto da principianti assoluti) allo spoke **`come-scrivere-un-soggetto-cinematografico`**, con hook opinionato: "il problema non è la sceneggiatura, è il soggetto — e lì si decide più di metà del lavoro". Motivi: prova il momentum (invece di rimandare alla porta d'ingresso), alza il livello per una lista che include professionisti, e aggancia la conversione primaria (laboratorio del soggetto) + il pre-annuncio di novembre. Aggiunta riga di raccordo alla Issue 2 come **teaser morbido** ("il passo che viene subito dopo il soggetto"), non come indice: comunica il ritmo senza vincolare la settimana successiva. La Issue 2 resta invariata.
- v5 (2026-10-02) — **Issue 1 alleggerita per mobile:** il blocco apertura (silenzio + "in questi mesi" + promessa settimanale) era un muro di testo, spezzato in blocchi da 1-2 righe; la promessa di formato ("un concetto / un'analisi / una scadenza") resa in **bullet**; il claim centrale diviso in righe corte ("Se è solido… / Se è debole…"). Nessun cambio di oggetto, preview o CTA.
- v6 (2026-10-02) — **Issue 2 riscritta: dal tema "tre documenti" al secondo atto.** La versione precedente spiegava la differenza soggetto/trattamento/scaletta ma chiudeva su Pagina Uno, un non-sequitur (un'analisi di sceneggiatura finita non mostra i documenti a monte). Nuovo tema: pillola sulla **struttura del secondo atto** (la parte che cede più spesso) + analisi **Little Miss Sunshine** come prova concreta, CTA a `/scomporre-il-secondo-atto-little-miss-sunshine/` (live). Testo reso in voce umana e senza trattini lunghi. La riga di raccordo della Issue 1 va riallineata a mano (a cura dell'utente).
- v7 (2026-10-02) — **Frase ispirazionale di chiusura dopo il CTA.** Aggiunta una riga motivazionale dopo il bottone e prima della firma su Issue 2 (`Il secondo atto è dove si decide se quella storia arriverà mai alla fine.`), Issue 3 (`A volte non serve riscrivere tutto. Serve qualcuno che ti dica da dove ripartire.`) e Issue 4 (`Un'idea tenuta nel cassetto non diventa mai un film.`). Convenzione codificata nel playbook §2. Issue 1 lasciata all'utente.
- v8 (2026-10-02) — **Ottobre ricalendarizzato sulla finestra iscrizioni 5-27 (avvio 3/11).** Il pre-annuncio a fine ottobre era incompatibile con la chiusura del 27. Nuovo piano: **Issue 1 (lun 5) = ritorno + apertura iscrizioni**, Issue 2 (lun 12) valore + richiamo finestra aperta, Issue 3 (lun 19) valore, **Issue 4 (gio 22) = ultima chiamata** a scadenza (fuori cadenza del lunedì per dare margine). Aggiunta email di avvio 3/11 e opzione teaser social nel weekend. Issue 1 riscritta (ruolo cambiato da ritorno soft ad apertura): hook "il soggetto è il vero lavoro" mantenuto come lead-in dell'offerta. Aggiornati §1, §3, §4.
- v10 (2026-10-06) — **1:1 fuori dalla finestra del gruppo.** L'**Extra di gio 8 diventa a offerta singola sul gruppo** (rimosso l'1:1: stesso prezzo/stesso esito creava confusione); **Issue 4** allineata (niente "in gruppo / 1:1"). Il **Laboratorio 1:1** ha ora una **send dedicata a offerta unica** post-finestra (oggetto "Il laboratorio con una sola persona"), lancio diretto con avvio **10/11** e 5 posti; angolo = l'edizione del gruppo finita con una sola persona; **i due consulenti** sono il differenziatore. Blocco: creazione della product page. Vedi `docs/marketing/launch/launch-individuale.md` v4-v6.
- v9 (2026-10-02) — **Ritorno e apertura separati: Issue 1 (lun 5) soft + Extra apertura (gio 8).** Applicata la regola playbook "valore prima della richiesta": la Issue 1 torna a essere **ritorno soft, senza vendita** (CTA all'articolo sul soggetto), l'apertura iscrizioni diventa l'**Extra di giovedì 8** ("da oggi aperte, fino al 27, si parte il 3/11"), self-contained. Finestra iscrizioni 8→27. Ponte tra le due: riga "Giovedì ti scriviamo di nuovo: c'è una novità" in Issue 1. Rimosso il pre-annuncio (ora superfluo: la Issue 1 lo fa in forma soft). Issue 2-4 invariate. Aggiornati §1, §3, §4.
