---
Status: done
Type: task
Blocked by: none
---

# 01: Lint e typecheck come guardrail

**What to build:** `npm run lint` esce con 0, `npm run typecheck` esiste ed esce con 0, e la CI
esegue entrambi su ogni push e pull request. Un errore meccanico — un import inutilizzato, un
hook dopo un early return, un errore di tipo — fallisce prima del merge invece che al deploy.

**Blocked by:** None (can start immediately)

**Status:** done

## Perché

`AGENTS.md` dice *"Before committing, always run `npm run lint`"*. Non è eseguibile:

```
npm run lint     → ✖ 284 problems (40 errors, 244 warnings)   exit 1
npx tsc --noEmit → exit 0
```

La CI (`.github/workflows/test.yml`) esegue solo `npm run test:run`; `bundle-budget.yml` esegue
l'analyzer. Non ci sono git hook. Nelle sessioni del 12 novembre l'agente ha aggirato il problema
con `npx eslint <file toccati>`: il gate documentato non esiste.

## Acceptance criteria

- [x] `npm run typecheck` (`tsc --noEmit`) esiste in `package.json` ed esce con 0.
- [x] `npm run lint` esce con 0. I 244 warning possono restare.
- [x] I tre difetti veri sono corretti, non silenziati:
      `src/shared/components/form-component/dynamic-form.tsx` chiama `useMemo`/`useForm` dopo un
      early return (`rules-of-hooks`); `src/modules/forms/builder/store/designer-provider.tsx` e
      `src/modules/mails/single-sends/ui/components/write-form.tsx` leggono ref durante il
      render.
- [x] La CI esegue lint e typecheck su push a `main` e su pull request. Il job non ha bisogno del
      database: `eslint` e `tsc` non lo toccano, ma `prisma generate` gira in `postinstall` e
      legge `DATABASE_URL`, quindi il job riusa la variabile fittizia già presente in
      `test.yml`.
- [x] La riga di `AGENTS.md` sul lint torna vera, oppure nomina il comando esatto.
- [x] (proposto) Una regola ESLint impedisce che un blocco futuro reintroduca il difetto del
      canvas: `href` dentro `src/puck/blocks/**` solo in `Image/ui/image.tsx`, che fa lo spread
      di `getInertAnchorProps`. Vedi la nota sotto.

## Inventario dei 40 errori

Rigenerabile con `npm run lint`. Nessuno è in `src/puck`: sono tutti precedenti.

| Classe | N. | File |
| --- | --- | --- |
| `no-require-imports` | 5 | `scripts/fix-user-uuids.cjs` |
| `react-hooks/set-state-in-effect` | 12 | `progress-loader`, `modal-provider`, `sheet-provider`, `post-category-form`, `post-form`, `product-form`, `new-subscription-form`, `remove-subscription-form`, `use-post-outline`, `product-reviews`, `use-mobile`, `carousel` |
| `no-non-null-asserted-optional-chain` | 8 | `ebook-card`, `products-list`, `webinar-card` |
| `react/no-unescaped-entities` | 4 | `properties-component`, `delete-dialog` |
| `react-hooks/rules-of-hooks` | 3 | `dynamic-form` |
| ref durante il render | 3 | `designer-provider` (2), `write-form` (1) |
| `prefer-const` | 2 | `api/admin/ads/[campaignId]/blocks/[blockId]/items/reorder/route.ts`, `link-renderer` |
| `@typescript-eslint/ban-ts-comment` | 1 | `write-form` (`@ts-ignore` → `@ts-expect-error`) |
| `no-empty-object-type` | 1 | `table-content/index.tsx` |
| `react-hooks/purity` | 1 | `sidebar.tsx` |

## Note

- Le regole del React Compiler (`set-state-in-effect`, ref durante il render, purity) qui sono
  **errori**, non warning. Per ognuna decidere se il codice cambia o se la regola va ristretta al
  file: non aggiungere `eslint-disable` in blocco.
- `no-explicit-any` è già un warning: non è parte di questo ticket.
- La regola proposta per `href`, da mettere in `eslint.config.mjs` accanto alle tre già presenti
  in `no-restricted-syntax`:

  ```js
  {
    files: ["src/puck/blocks/**/*.tsx"],
    ignores: ["src/puck/blocks/Image/ui/image.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='href']",
          message:
            "Route links through InlineSmartLink, or spread getInertAnchorProps. See docs/puck-canvas.md.",
        },
      ],
    },
  },
  ```

  Il valore è che il prossimo blocco con un anchor come radice non può dimenticare il contratto:
  il difetto dell'Image è arrivato in produzione perché l'insieme dei blocchi era nella testa di
  chi scriveva la spec. Se la regola risulta rumorosa su un caso legittimo, l'eccezione va
  aggiunta a `ignores` con una riga di commento.
- Verifica finale: `npm run lint`, `npm run typecheck`, `npm run test:run`.

## Comments

- 2026-11-12 — Ticket scritto dal retro. Evidenza: due sessioni sul ticket
  `puck-link-block-contract/02` (566k e 185k token in input), il primo tentativo `fe11f23a`
  superò test e review con i link ancora attivi.
- 2026-11-12 — Implementato in `f303e970`. `npm run lint` esce 0 (243 warning, 0 errori),
  `npm run typecheck` esce 0, `npm run test:run` passa (249 file / 2116 test).
  - CI: nuovo job `static-analysis` in `.github/workflows/test.yml` su push a `main` e su pull
    request, con la stessa `DATABASE_URL` fittizia di `test.yml` e senza servizio Postgres.
  - I tre difetti veri sono corretti nel codice: il parsing JSON di `dynamic-form` vive in un
    `useMemo` e il return d'errore è dopo tutti gli hook; `designer-provider` crea lo store con
    l'initializer pigro di `useState`; `write-form` tiene l'editor in stato invece che in un ref
    (rimossi il `@ts-ignore` e l'`onLoad` vuoto).
  - Gli errori meccanici restanti sono corretti nel codice (stati derivati, `prefer-const`,
    entity JSX, non-null dopo optional chain, interfaccia vuota, `Math.random` nel render).
    `carousel`, `product-reviews` e `use-mobile` leggono lo stato esterno con
    `useSyncExternalStore`; i tre mount guard usano il nuovo `useHydrated()`.
  - `use-post-outline` è l'unica eccezione: `set-state-in-effect` è declassato a warning solo
    per quel file, perché rispecchia lo stato mutabile di Tiptap e non è convertibile a snapshot
    senza riscrivere l'outline. La motivazione è nel commento accanto alla regola.
  - La regola `href` è attiva per `src/puck/blocks/**/*.tsx` con eccezione
    `Image/ui/image.tsx`; i tre selettori SQL sono estratti in una costante condivisa, così
    restano attivi anche nei blocchi Puck.
  - Code review (standards + spec, in parallelo): un solo problema bloccante, l'override scoped
    di `no-restricted-syntax` che cancellava le guardie SQL nei blocchi, corretto prima del
    commit; gli altri rilievi erano giudizi (duplicazione tra le due form di conferma e tra i
    due mirror Embla) lasciati com'erano.
