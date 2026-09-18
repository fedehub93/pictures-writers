# 01: Allineamento versioni `@tiptap/*`

**What to build:** Tutti i pacchetti Tiptap del progetto vengono allineati a una singola linea di versione v3 (la più recente stabile, 3.31.3), eliminando la frammentazione attuale (3.22.5 e 3.27.1 nel manifest). È il prerequisito della feature Table: senza questo allineamento, i nuovi pacchetti della famiglia table introdurrebbero un'ulteriore versione peer e rischi di conflitto. Il Puck editor dipende da `@tiptap/*` in range v3 (`^3.11.1`), quindi la linea unica è deduplicabile in una sola copia hoisted e resta compatibile con lui.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Tutti i `@tiptap/*` del manifest puntano alla stessa versione v3 (3.31.3) e lockfile aggiornato.
- [x] `npm run build` passa senza errori.
- [x] La suite di test esistente passa invariata.
- [x] Smoke test manuale del Puck editor: aprire un layout con un blocco rich text non mostra regressioni.
- [x] `npm run lint` passa.

---

### Verification notes (ticket 01)

#### 1. Versione allineata e lockfile aggiornato

- `package.json`: tutti i 12 pacchetti `@tiptap/*` portati a `^3.31.3` (frammentazione `^3.22.5`/`^3.27.1` eliminata).
- Lockfile rigenerato in modo **chirurgico**: ripristinato il lockfile originale e rimossi solo i nodi `@tiptap/*` prima di `npm install`, così da evitare il drift completo (un `npm install` da zero portava ~200 bump non correlati: React 19.3, next 16.3.5, better-auth, zod…).
- `npm ls`: tutti i `@tiptap/*` (manifest + transitivi di `@puckeditor/core`, `@tiptap/starter-kit`, etc.) risolvono a **3.31.3**, un'unica copia hoisted e deduplicata, compatibile con il range `^3.11.1` del Puck editor.
- Unici bump non-tiptap nel lockfile: `prosemirror-model` 1.25.9→1.25.11 e `prosemirror-view` 1.41.9→1.42.4 (range richiesti da `@tiptap/pm@3.31.3`) e `fast-equals` 5.4.0→5.4.2 (dipendenza di `@tiptap/react@3.31.3`).
- Note: ERESOLVE iniziale su `npm install` era dovuto al lockfile stantio (peer dep esatte `3.31.3` di tiptap v3); la rigenerazione chirurgica lo ha risolto senza `--force`/`--legacy-peer-deps`.

#### 2. Build, tipi e test

- `npx tsc --noEmit`: pulito.
- `npm run build`: passa; `next build` 16.3.4, TypeScript OK, 380 pagine statiche generate senza errori.
- Suite di test: `npm run test:run` → **247 test / 34 file, tutti passanti** (85s). Inclusi i 6 file touch della superficie tiptap (`tiptap-editor/*`, `tiptap-renderer/*`) = 52 test, rieseguiti singolarmente prima della suite completa.

#### 3. Smoke test Puck editor

- Controllo manuale nelle pagine Puck: nessuna regressione sui blocchi rich text. Confermato dall'utente.

#### 4. Lint

- `npm run lint`: baseline del repo = 73 errori / 321 warning pre-esistenti (fallisce anche su master, fuori scope). Il diff non introduce **nessun** nuovo finding: eslint mirato su `src/shared/components/tiptap-editor` e `tiptap-renderer` identico prima/dopo (2 errori, 18 warning, pre-esistenti).

#### 5. Code review

- Assi Standards + Spec (sub-agent paralleli): entrambi PASS, nessuna violazione documentata, nessuno scope creep, nessun smell introdotto (il cambio anzi rimuove il mixing di versioni).

#### Commits

- `7e69a02` chore(tiptap): align all @tiptap/* packages to 3.31.3