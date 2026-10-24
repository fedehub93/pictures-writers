# Media pipeline

**Status:** `ready-for-agent`

## Problem Statement

Le immagini vengono ottimizzate **a runtime sulla VPS**. Next.js 16 ha l'optimizer attivo (`images.remotePatterns`, nessun `unoptimized`), quindi ogni combinazione `src × width × quality` viene scaricata da UploadThing, ridimensionata con sharp e messa in cache su disco: su una singola VPS da 4 vCPU e 8 GB, con Postgres e i build Next sullo stesso host, la CPU delle immagini compete con tutto il resto. La cache di Next 16 occupa di default il 50% del disco libero, quindi su 80 GB NVMe cresce fino a contendere spazio con database e backup. `minimumCacheTTL` è 31 giorni e non esiste invalidazione: se un'immagine viene sostituita, la cache può continuare a servirla.

I dati per servire bene le immagini non esistono: `Media` salva solo `name`, `key`, `url`, `size`, `type`, `altText`. Nessuna dimensione intrinseca, nessun checksum, nessun placeholder, nessuna rendition. La consequenza è che ogni `<Image>` deve affidarsi all'optimizer, i layout non possono riservare spazio (CLS), e non c'è modo di deduplicare un file ricaricato.

L'URL è trattato come verità: `Media.url` è un URL assoluto di UploadThing e lo stesso vale per gli URL dentro `puckData`, `tiptapBodyData`, `AdItem.imageUrl`, `Settings.logoUrl` e l'HTML delle email. Spostare i byte su un altro provider oggi significherebbe riscrivere contenuti, non configurazione: inaccettabile per un CMS che deve poter essere venduto e installato con storage diverso.

La cancellazione è incompleta: `src/app/api/media/bulk_delete/route.ts` elimina la riga e chiama `UTApi.deleteFiles(key)` solo sull'originale, senza controllare i riferimenti; le relazioni `imageCoverId` sono opzionali, quindi Prisma azzera la cover di un post in silenzio.

A questo si aggiungono due difetti misurati durante l'analisi: `src/modules/blog/posts/ui/public/components/post-card.tsx:50` ha `sizes="(max-width:1280px) 90w, 40vw"` (unità inesistente: le card scaricano come se occupassero 100vw), e la documentazione di self-hosting dichiara `unoptimized: true` quando non è vero.

## Solution

Spostare l'intera catena immagine **fuori dal path di richiesta**: i byte vivono su un provider dietro un `StorageDriver`, le rendition (taglie e formati) vengono generate **una sola volta** al momento dell'upload, e la consegna avviene direttamente dal CDN del provider attraverso un **loader custom di `next/image`**. La VPS non tocca più un'immagine durante una visita: al massimo risponde "questa rendition non esiste, usa l'originale".

`Media` diventa l'identità logica di un file: chiave di storage, tipo, MIME, byte, checksum, alt text, metadati del tipo (dimensioni, blur placeholder) e manifest delle rendition derivate. L'URL diventa una proiezione della chiave, non il dato. Il contenuto continua a referenziare `Media` per relazione e continua a contenere URL assoluti dentro i JSON: il loader li risolve per pattern, senza migrare Puck, TipTap o le email.

UploadThing resta l'unico driver in v1 (free tier 2 GB, egress illimitato, CDN già in essere) ma è dietro il seam: aggiungere domani un driver S3/R2 o disco locale è un'implementazione, non una riscrittura. Le 674 immagini esistenti ricevono i metadati con un backfill una-tantum e le rendition con un job off-peak; fino ad allora continuano a essere servite come originali.

Per l'admin: upload più lento di pochi secondi (una volta), media library sempre leggibile con una riga per file, avviso quando carica un file che esiste già, archiviazione reversibile, eliminazione definitiva esplicita. Per il visitatore: immagini della taglia giusta servite dal CDN, placeholder reale per le immagini grandi, nessun degrado quando la VPS è sotto carico.

## User Stories

1. As a visitor, I want each image served at a width close to what my viewport needs, so that pages load quickly and consume less data.
2. As a visitor, I want images in modern formats (AVIF/WebP) without doing anything, so that pages are lighter than today with no change on my side.
3. As a visitor, I want large cover images to show a blurred preview immediately, so that the page does not jump while the full image loads.
4. As a visitor, I want images that are never broken, so that a missing rendition falls back to the original instead of showing a broken icon.
5. As a visitor on mobile, I want to download a small rendition rather than the desktop one, so that data usage and LCP improve.
6. As a visitor, I want the site to stay responsive during traffic spikes, so that image CPU on the VPS never delays a page.
7. As an admin, I want one library row per uploaded file, so that the media library stays comprehensible and does not fill with generated copies.
8. As an admin, I want to see, for each Media, the intrinsic dimensions, MIME type, byte size and archive state, so that I can judge a file before using it.
9. As an admin, I want upload to process the file once and then be done, so that I never wait for images again on any visit.
10. As an admin, I want to be warned when the file I am uploading already exists (same checksum), with the option to use the existing Media, so that I do not accumulate duplicates by accident.
11. As an admin, I want to be able to upload anyway despite a duplicate warning, so that two rows with the same bytes but different alt text or name remain possible.
12. As an admin, I want to replace a file inside an existing Media without touching any post, page or product, so that fixing an image is a local operation.
13. As an admin, I want a replaced file to be served immediately everywhere, so that no cache keeps showing the old version.
14. As an admin, I want to change alt text without re-uploading the file, so that accessibility fixes are cheap.
15. As an admin, I want to archive a Media instead of deleting it, so that a mistake does not break published pages.
16. As an admin, I want archived Media to disappear from the library but keep working on the site, so that "removed from the library" and "removed from the web" are distinct.
17. As an admin, I want to restore an archived Media, so that archiving is reversible.
18. As an admin, I want to see how many contents reference a Media, so that I know the impact before an irreversible action.
19. As an admin, I want permanent deletion to be explicit and available only on archived Media, so that I cannot destroy a file in one accidental click.
20. As an admin, I want permanent deletion to remove the original and every generated rendition, so that no storage is leaked.
21. As an admin, I want PDFs, audio and video to keep working exactly as today, so that this change never regresses attachments.
22. As an admin, I want the rich-text, Puck and product image pickers to keep behaving the same, so that editing content does not change.
23. As an admin, I want a failed image processing to tell me it failed, so that I do not publish a file that will never have renditions.
24. As a developer, I want a single storage seam (put, delete, delete-prefix, url) so that changing provider is one implementation, not a migration of content.
25. As a developer, I want the delivery URL derived from a storage key, so that no content stores a provider-specific URL as truth.
26. As a developer, I want renditions to be derived data (a manifest on the Media row, not rows of their own), so that the library stays one row per file.
27. As a developer, I want the rendition ladder to be a code constant that matches Next's `deviceSizes`/`imageSizes`, so that the loader never requests a width that was not generated.
28. As a developer, I want the loader to round down to the nearest generated rendition and fall back to the original, so that a missing rendition is never a broken image or a server round-trip.
29. As a developer, I want a deterministic storage key layout (`<id>/<revision>/<profile>.<ext>`), so that deletion and garbage collection are prefix operations.
30. As a developer, I want a revision counter bumped on file replacement, so that keys change and no CDN cache can serve the previous file.
31. As a developer, I want the loader to resolve legacy absolute URLs by host pattern, so that Puck, TipTap, email HTML and ad images need no migration.
32. As a developer, I want non-media URLs (external avatars, SVGs, data URIs) to pass through untouched, so that the loader is safe to apply globally.
33. As a developer, I want a local-disk driver exercised in tests, so that the seam has a second implementation and is proven to be real.
34. As a developer, I want an idempotent backfill job for existing Media, so that re-running it never duplicates renditions or fails on already-processed rows.
35. As a developer, I want the backfill to be runnable off-peak with bounded concurrency, so that it never starves Postgres or the app on 4 vCPU.
36. As an operator, I want no new paid service and no new infrastructure (no queue, no worker, no Redis), so that the monthly cost stays at the VPS.
37. As an operator, I want the storage driver and its credentials chosen by configuration, so that enabling another provider later is a deploy-time change.
38. As an operator, I want image processing to leave no partial state when it fails, so that the library never contains a half-processed file.
39. As an operator, I want the docs to describe the actual image behaviour again, so that the self-hosting runbook stops lying about `unoptimized`.
40. As a future maintainer, I want an ADR recording why renditions are pregenerated and why UploadThing is only a driver, so that the next engineer does not "simplify" it back to on-demand optimisation.

## Implementation Decisions

### 1. Vocabolario e modello

Si usa il vocabolario di `CONTEXT.md` e l'ADR-0026: **Media**, **Media type**, **Media rendition**, **Media profile**, **Storage key**, **Storage driver**, **Media revision**, **Archived media**. Non si introducono `Asset`, `Variant`, `Kind` o `MediaVariant`.

`Media.type` (enum esistente `AUDIO | FILE | IMAGE | VIDEO`) è il discriminatore: nessun nuovo enum, nessun campo `kind`.

Campi aggiunti a `Media`:

- `mimeType String?`
- `size` (esistente) riempito sempre
- `checksum String?` — sha256 del contenuto originale, indicizzato per la ricerca dei duplicati
- `revision Int @default(1)`
- `metadata Json` — tipizzato per `Media.type`; per le immagini: dimensioni intrinseche, `blurDataURL`, eventuale `orientation`. Mai letto dal path di consegna.
- `renditions Json` — manifest scritto solo dal processore: per ogni profilo/formato `{ key, width, height, bytes, format }`. Non esposto dalle API della media library.
- `archivedAt DateTime?` — l'archiviazione è uno stato, non una cancellazione.
- `key` resta la chiave dell'originale; `url` resta per compatibilità e per la media library, ma non è più la verità della consegna.

I campi `width`/`height` dell'originale vivono in `metadata`, non in colonne: servono al rendering e al blur, non a query.

### 2. Seam di storage

Interfaccia server-only, un driver per installazione scelto da configurazione:

- `put(key, bytes, contentType)`
- `delete(key)` e `deletePrefix(prefix)`
- `url(key)` — URL pubblico dell'oggetto
- `get(key)` — byte dell'originale, necessario per processare e per il backfill

Driver v1: `uploadthing` (produzione) e `local` (disco, usato dai test; non esposto in admin). Nessuna UI di scelta, nessuna card in Integrations: le credenziali restano in ambiente finché non esiste un secondo driver reale. Va registrata come eccezione consapevole all'ADR-0023.

Layout delle chiavi: `<mediaId>/<revision>/original` e `<mediaId>/<revision>/<width>.<format>`. Il prefisso `<mediaId>/` è l'unità di cancellazione.

### 3. Ladder delle rendition

Costante nel codice, allineata alla configurazione immagini di Next:

- `deviceSizes: [360, 480, 720, 960, 1440, 1920]`
- `imageSizes: [128, 256]`
- formati: AVIF e WebP, con qualità per formato
- lato massimo del sorgente normalizzato in ingresso; EXIF rimosso; orientamento applicato

Profili con nome (`thumb`, `card`, `cover`, `og`) mappano i ruoli dell'interfaccia alle larghezze. La selezione dei profili da Settings **non** è in v1: i ruoli sono fissi nel codice, il contratto è pronto per renderli configurabili.

`images.qualities` scende ai valori della ladder; le due occorrenze di `quality={100}` vanno allineate. Il loader arrotonda alla rendition generata più vicina (mai superiore alla richiesta) e ripiega sull'originale.

### 4. Loader

Modulo `loaderFile` di Next, funzione pura e testabile:

- URL del provider riconosciuto (host UploadThing, URL legacy `/assets/*`) → chiave → manifest → URL della rendition per la larghezza richiesta
- rendition assente o Media archiviato → URL dell'originale
- qualunque altro URL (avatar esterni, SVG, `data:`) → invariato

Nessuna richiesta alla VPS durante la consegna. `/_next/image` esce dal path e `images.remotePatterns` diventa inutile: va rimosso insieme alle altre opzioni dell'optimizer che non si applicano più.

### 5. Flusso di upload

Upload del file al provider (meccanismo attuale), poi una singola richiesta server-side che:

1. scarica l'originale dal driver e calcola byte, MIME, dimensioni, orientamento, checksum e blur placeholder;
2. se il checksum esiste già, risponde con conflitto + il Media esistente, e l'admin sceglie "usa quello" o "carica comunque" (override esplicito);
3. genera le rendition della ladder e le carica;
4. scrive la riga `Media` completa di manifest, oppure fallisce senza creare righe.

La lavorazione è sincrona perché è admin-only e su file ≤ 4 MB; un errore non deve lasciare righe parziali. Un'azione di riprocessamento manuale copre il caso di un Media il cui processing è stato interrotto.

### 6. Sostituzione del file

Stesso `Media`, `revision` incrementata: nuove chiavi per originale e rendition, nuovi caricamenti, poi cancellazione del prefisso della revisione precedente. I riferimenti nei contenuti non cambiano. L'ordine è "scrivi il nuovo, poi cancella il vecchio" per non avere mai un URL rotto.

### 7. Archiviazione ed eliminazione

- Archiviare valorizza `archivedAt`: sparisce dalla library, resta servito e referenziabile.
- "Usato in N" si calcola dalle relazioni esistenti (`PostVersion`, `PageVersion`, `ProductVersion`, `ProductGallery`, `Seo`, `User`, `Impression`); i riferimenti dentro i JSON non sono contabili e vanno dichiarati come tali nell'interfaccia.
- L'eliminazione definitiva è manuale, disponibile solo su Media archiviati, e cancella la riga più il prefisso `<mediaId>/`. Nessun job di garbage collection, nessuna scadenza.
- Il percorso attuale di `bulk_delete` viene riallineato: deve cancellare il prefisso e non azzerare cover in silenzio.

### 8. Backfill delle 674 Media esistenti

Job manuale, off-peak, idempotente, con concorrenza limitata:

- riempie i metadati mancanti di tutte le immagini;
- genera le rendition solo per i Media che ne sono privi;
- salta e registra i sorgenti non più raggiungibili, senza interrompere il resto;
- può essere rieseguito senza duplicare nulla.

Fino al completamento, il loader serve gli originali: nessuna finestra di immagini rotte, nessun blocco del deploy.

### 9. Perimetro dei tipi

Solo `IMAGE` viene processato. `VIDEO`, `AUDIO` e `FILE` sono memorizzati e serviti intatti, con i soli metadati ricavabili senza ffmpeg: nessun poster, nessuna durata estratta, nessuna dipendenza binaria nuova nel container.

### 10. Correzioni collaterali

- `post-card.tsx:50`: `90w` → `90vw`.
- Occorrenze di `quality={100}` allineate alla ladder.
- Documentazione self-hosting: rimuovere l'affermazione `unoptimized: true` e descrivere il nuovo comportamento.

## Testing Decisions

Un buon test verifica **comportamento osservabile attraverso l'interfaccia pubblica del modulo**, non la sequenza interna di chiamate a sharp: dato un input (file, manifest, URL), l'output è un URL, una riga, o un effetto sullo storage. Niente mock di sharp, niente asserzioni su quale profilo sia stato generato per primo. I test girano contro il Postgres di test (`.env.test`) e un driver su directory temporanea, così ogni esecuzione è isolata.

**Seam 1 — loader (unit).** Funzione pura, casi: rendition esistente → URL rendition; rendition mancante → originale; larghezza non in ladder → arrotondamento; URL non-media → invariato; URL legacy `/assets/*` → risolto; Media archiviato → originale. Prior art: `src/modules/integrations/lib/__tests__/resolution.test.ts`.

**Seam 2 — media service (integrazione, DB + driver su disco).** Casi: creazione con generazione completa (manifest coerente con la ladder, chiavi nel formato atteso); checksum duplicato → conflitto con il Media esistente; override → seconda riga; sostituzione → revision incrementata, chiavi cambiate, prefisso vecchio assente; archiviazione → nascosto dalla library ma ancora risolvibile; eliminazione definitiva → riga e prefisso assenti; backfill rieseguito due volte → nessun duplicato e nessun errore; sorgente mancante → saltato senza interrompere il job. Prior art: i test di risoluzione e i test che usano il DB di test.

**Seam 3 — contratto admin (tRPC/route).** Solo i comportamenti che l'admin vede: upload con conflitto di checksum e relativa risposta, archivia/ripristina, eliminazione definitiva negata su Media non archiviato, conteggio "usato in N". Prior art: `src/modules/integrations/server/__tests__/integrations-router.test.ts`.

Non si testano i componenti React che usano `<Image>`: il markup non cambia, cambia solo la configurazione del loader.

## Out of Scope

- Driver S3/R2 e relativa integrazione in admin; UploadThing resta l'unico driver di produzione.
- Poster/durata per i video, ffmpeg nel container.
- Job pianificato di garbage collection per i Media archiviati.
- Cartelle, tag, ricerca avanzata, deduplica retroattiva dei Media già esistenti.
- Editing/crop delle immagini, generazione automatica di alt text.
- Selezione dei profili da Settings (il contratto è pronto, la UI no).
- Riscrittura degli URL assoluti dentro `puckData`, `tiptapBodyData`, HTML email, `AdItem.imageUrl`, `Settings.logoUrl`.
- Multi-tenancy e isolamento per workspace.
- Pulizia manuale della cache immagini di Next già presente su disco (va solo documentata come irrilevante dopo il passaggio al loader).

## Further Notes

- Ordine di grandezza misurato: 674 immagini, media 163 KB, massimo 366 KB, ~0,1 GB totali. Con 8 larghezze × 2 formati si arriva a ~0,3–0,4 GB: ampiamente dentro i 2 GB del piano free di UploadThing, con margine per la crescita.
- Il backfill produce ~8.000–10.000 piccoli oggetti: è la parte più lenta del lavoro, va eseguita in una finestra di basso traffico, non durante un deploy.
- L'archiviazione senza garbage collection fa crescere lo storage finché qualcuno non elimina a mano: accettato consapevolmente, con 0,4 GB su 2 GB di margine.
- Le email continuano a usare URL assoluti: in quel contesto l'URL *è* il dato e non deve passare dal loader.
- L'eccezione all'ADR-0023 (credenziali di storage in ambiente invece che in `Integration`) è temporanea e va rimossa quando esisterà un secondo driver.
- Riferimento: `docs/adr/0026-media-storage-seam-and-pregenerated-renditions.md`.
