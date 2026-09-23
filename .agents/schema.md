# Schema JSON-LD — Pictures Writers

**Document version:** v1
**Last updated:** 2026-09-23
**Status:** Fase 6 della roadmap SEO

---

## 1. Schema markup attualmente erogato

Tutti i componenti vivono in `src/app/(home)/_components/seo/json-ld/` e usano `JsonLdData` (`WithContext<Thing> | Graph`) via schema-dts.

| Pagina | Schema | Componente |
|---|---|---|
| Tutto il sito (layout) | WebSite + Organization (`sameAs`) | `website.tsx` |
| Post blog | BlogPosting + BreadcrumbList + VideoObject (YouTube) | `blog-posting.tsx` |
| Blog `/blog/` | ItemList | `item-list.tsx` |
| Blog `/blog/<page>`/categoria/tag | ItemList | `item-list.tsx` |
| Pagine prodotto shop | Product + BreadcrumbList + FAQPage | `product.tsx` |
| Prodotto `WEBINAR` | Course + Event (per lezione) | `course.tsx` + `event.tsx` |

---

## 2. Novità di questa fase

### 2.1 `item-list.tsx` — ItemList per elenchi blog
- `/blog/` (`blog-view.tsx`) e `/blog/2/…`/categoria/tag (`blog-categories-tags.tsx`).
- Ogni post diventa `ListItem` con `position` incrementale e URL canonico (trailing slash).
- Rilasciato solo se l'elenco ha ≥ 1 post (null altrimenti).

### 2.2 `event.tsx` e `course.tsx` — Event/Course sui prodotti webinar
- Dato modello: `Product.type === ProductType.WEBINAR`, `metadata.lessons[]` con `{title?, date, startTime, endTime}` (vedi `src/types.ts` `WebinarLesson`).
- **Course** per TUTTI i prodotti `ProductType.WEBINAR` (la pagina decide via `isWebinarMetadata(product.metadata)`, NON via slug di categoria); **Event** per qualsiasi webinar con ≥ 1 lezione valida.
- Corso di gruppo (`Laboratorio di scrittura di un soggetto`) → Course + Event per ogni lezione.
- `Course`: `Course` + `hasCourseInstance.CourseInstance` con `courseMode: "online"`, `location` VirtualLocation, offer con `availability`. `learningResourceType` è opzionale e NON valorizzato in pagina (il valore specifico 1:1 non vale per gli altri webinar).
- `Event`: 1 lezione → singolo `Event`; più lezioni → `@graph` di `Event` (ognuno con `@id` `#event-N` e offer `#offer-N`). `eventAttendanceMode`/`VirtualLocation` online, `maximumVirtualAttendeeCapacity` = `seats`.
- `offers.availability` tipizzato `ItemAvailability` (schema-dts).

### 2.3 `blog-posting.tsx` — video come VideoObject
- `video` ora espone `VideoObject` strutturati (`name`, `description`, `thumbnailUrl` = imageCover, `uploadDate` = datePublished, `contentUrl`/`embedUrl` = stringa YouTube) invece di stringhe → rich snippet Video consentito.

### 2.4 `lib/rome-time.ts` — conversione difensiva Europe/Rome
- `toRomeIso(dateInput, time)` restituisce `string | null`:
  - accetta sia `YYYY-MM-DD` sia timestamp ISO completo (data reale in DB: `2026-09-07T22:00:00.000Z` da date-picker del form admin);
  - estrae il giorno civile **Europe/Rome** (coerente con `formatDate` in `src/lib/format.ts`); calcola offset DST su quell'istante;
  - scarta (→ null) date non parseable o `startTime`/`endTime` non in formato `HH:MM`.
- Le lezioni con data/ora invalida vengono escluse; se nessuna è valida il componente ritorna `null` (niente JSON rotto nel prerender).
- Nota: prima del fix il prerender crashava su `/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto` (`RangeError: Invalid time value`).

---

## 3. Decisioni e trade-off

1. **Lezione singola = Event, più lezioni = @graph di Event.** Gli eventi ricorrenti "una tantum per singola data" sono più robusti di `eventSchedule`.
2. **Course per ogni prodotto `ProductType.WEBINAR`.** La decisione è sul type, non sullo slug di categoria (feedback: rinominate lo slug senza conseguenze). Niente `learningResourceType` specifico in pagina (solo reso se la pagina lo fornisce). I prodotti non-webinar restano `Product`. `@id` distinti (course `#course` / `#course-instance`, event `#event-N`) per evitare conflitti nel Knowledge Graph.
3. **Date in Europe/Rome, non UTC.** Il DB salva mezzanotte locale dell'admin come timestamp UTC; il rendering pubblico (`formatDate`) usa Europe/Rome. Coerenza UI/JSON-LD, no off-by-one.
4. **Niente `SearchAction`** sul WebSite (ricerca client-side AJAX) — già deciso in fase 2.
5. **Pagine draft (`/draft/...`) escluse** (noindex, anteprima).
6. **ContactPage NON implementato.** Il sito non ha un campo "kind" pagina (le pagine Puck sono generiche nel DB) → rilevare `/contatti/` via slug in code sarebbe fragile; preferito non erogare ContactPage per ora. `contact-page.tsx` rimosso. (Se servirà: campo enum `Page.kind` valorizzato dal form admin, o ripristinare su rilevazione semantica.)

---

## 4. Priorità di intervento (dopo la fase 6)

- Fase 7: **emails** (sequenze lifecycle; deliverable questo documento la precede: funnel già mappato in `cro.md`).
- Fase 8: **ai-seo** (ottimizzazione per citazioni LLM).
- Fase 9: **marketing-plan** (fCMO/AARRR 13 sezioni).