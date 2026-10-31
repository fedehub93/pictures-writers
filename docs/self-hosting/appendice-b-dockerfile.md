# Appendice B — Dockerfile (alternativa a Nixpacks)

Nixpacks è la strada consigliata per questa applicazione: installa tutte le dipendenze, mantiene `node_modules` completo (Prisma CLI, sharp, handlebars) e non richiede modifiche al repository.

Questa appendice serve se:

- Nixpacks non riesce a raggiungere il DB in build;
- vuoi un'immagine riproducibile e versionata;
- vuoi costruire in CI e deployare da registry;
- devi fare cross-build per ARM64.

> **Attenzione:** un Dockerfile mal fatto può rompere Prisma, sharp o l'alias di handlebars. Testa sempre in staging.

---

## 1. Opzione B.1 — Dockerfile "full" (consigliato se usi Docker)

Immagine più grande (~1,3–2 GB) ma **affidabile**: include `node_modules`, Prisma CLI, sharp, handlebars, ed esegue le migrazioni all'avvio.

### 1.1 `Dockerfile`

> Il tag è pinnato a `24.18.0`, lo stesso di `.nvmrc`. Serve: `npm@12` richiede Node ≥ 24.15, quindi un tag floating come `node:24` può puntare a una patch più vecchia e far fallire `npm install -g npm@12.0.2` con `EBADENGINE`. Quando aggiorni Node, aggiorna insieme tag dell'immagine, `.nvmrc` e versione di npm.

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:24.18.0-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# DATABASE_URL deve essere dichiarata PRIMA di npm ci:
# il postinstall esegue `prisma generate`, che legge prisma.config.ts.
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npm install -g npm@12.0.2 && npm ci

COPY . .

# ── Variabili necessarie al build ─────────────────────────────
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=3072

# Next legge il DB durante il build: applica prima le migrazioni.
# Se costruisci in CI contro un DB diverso dalla produzione, valuta
# se saltare questo step e migrare il DB di destinazione a parte.
RUN npx prisma migrate deploy && npm run build

# ── Runtime ───────────────────────────────────────────────────
FROM node:24.18.0-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

CMD ["sh", "scripts/start-production.sh"]
```

`scripts/start-production.sh` è lo stesso descritto in `04-deploy-applicazione.md` §2.2:

```bash
#!/bin/sh
set -eu

attempt=0
until npx prisma migrate deploy; do
  attempt=$((attempt + 1))
  echo "[start] migrate failed (attempt ${attempt}/30), retrying in 5s..."
  if [ "$attempt" -ge 30 ]; then
    echo "[start] giving up after 30 attempts"
    exit 1
  fi
  sleep 5
done

echo "[start] migrations applied, starting Next.js"
exec npm run start
```

### 1.2 `.dockerignore`

```
node_modules
.next
.git
.github
docs
.scratch
.reference
coverage
*.log
.env
.env.*
!.env.example
tests
```

> Non copiare `.env` nell'immagine. Le variabili arrivano da Coolify.

### 1.3 Build locale (test)

```bash
docker build \
  --build-arg DATABASE_URL='postgresql://...' \
  --build-arg NEXT_PUBLIC_APP_URL='https://staging.<DOMAIN>' \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_...' \
  --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY='...' \
  --build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY='...' \
  -t pictures-writers:local .
```

### 1.4 Build per la VPS ARM64

Se costruisci su una macchina x86:

```bash
docker buildx create --use --name pw-builder 2>/dev/null || true
docker buildx build \
  --platform linux/arm64 \
  --build-arg DATABASE_URL='...' \
  --build-arg NEXT_PUBLIC_APP_URL='...' \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='...' \
  --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY='...' \
  --build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY='...' \
  -t ghcr.io/<GH_USER>/pictures-writers:latest \
  --push .
```

Poi in Coolify: **Build Pack: Docker Image**, image `ghcr.io/<GH_USER>/pictures-writers:latest`, registry credentials.

> Le `NEXT_PUBLIC_*` sono **cotte nell'immagine**. Se cambi dominio o chiavi pubbliche, devi ricostruire l'immagine, non solo cambiare l'env a runtime.

### 1.5 Build nativa sulla VPS (più semplice)

Coolify con **Build Pack: Dockerfile** costruisce sulla VPS ARM: è nativo, nessun cross-build. Imposta:

- Dockerfile Location: `/Dockerfile`
- Ports Exposes: `3000`
- Build args: abilita l'iniezione automatica (Coolify aggiunge gli `ARG` per le variabili build-time)

> Se Coolify inietta gli `ARG` automaticamente e il Dockerfile li dichiara già, potresti vedere duplicati. In **Advanced → Build arguments** scegli **Managed manually in Dockerfile** e passa tu i build args, oppure rimuovi gli `ARG` dal Dockerfile e lascia fare a Coolify. Non entrambi.

---

## 2. Opzione B.2 — Standalone (immagine piccola)

Richiede una modifica a `next.config.mjs`:

```js
const nextConfig = {
  output: "standalone",
  // ...resto
};
```

### 2.1 Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:24.18.0-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Serve già qui: il postinstall esegue `prisma generate`.
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npm install -g npm@12.0.2 && npm ci

FROM deps AS builder
COPY . .
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=3072
RUN npm run build

# Immagine per le migrazioni (eseguita una volta prima del deploy)
FROM deps AS migrator
COPY prisma ./prisma
COPY prisma.config.ts ./
CMD ["npx", "prisma", "migrate", "deploy"]

# Runtime minimale
FROM node:24.18.0-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 2.2 Migrazioni

L'immagine standalone **non** contiene Prisma CLI. Le migrazioni vanno eseguite separatamente:

```bash
# Costruisci il migrator
docker build --target migrator -t pictures-writers-migrator .

# Eseguilo con il DATABASE_URL giusto (rete Coolify o host raggiungibile)
docker run --rm \
  -e DATABASE_URL='postgresql://...' \
  pictures-writers-migrator
```

In Coolify puoi:

- eseguire il migrator da CI **prima del build** dell'immagine app, così il DB usato da `next build` ha già lo schema nuovo;
- eseguire il migrator da CI prima del deploy;
- creare una piccola applicazione "migrate" con lo stesso repo e target `migrator`, da lanciare manualmente;
- eseguire `npx prisma migrate deploy` dal terminale di un container temporaneo.

**Non** avviare l'app standalone su un DB senza schema: fallirà.

### 2.3 Caveat dello standalone per questa app

Questa applicazione usa:

- `sharp` (binario nativo) → verifica che `@img/sharp-linux-arm64` sia incluso nel trace;
- `handlebars` con alias a `handlebars/dist/handlebars.js` → verifica che sia incluso;
- Prisma 7 con `query_compiler_fast_bg.wasm` in `generated/prisma` → deve essere nel trace;
- `public/` letto a runtime da `src/lib/image.ts` → copiato manualmente;
- `next.config.mjs` con `outputFileTracingIncludes` che punta a `./node_modules/.prisma/client/**/*` (path non usato da Prisma 7 con output custom).

Se ottieni errori a runtime (`Cannot find module`, WASM mancante, template email vuoti), aggiungi:

```js
outputFileTracingIncludes: {
  "/*": [
    "./generated/prisma/**/*",
    "./node_modules/handlebars/dist/**/*",
    "./node_modules/sharp/**/*",
    "./node_modules/@img/**/*",
  ],
},
```

e rideploya. Per questo motivo, per questa app, **B.1 è più sicuro** di B.2.

---

## 3. Docker Compose per test locale

`docker-compose.local.yml`:

```yaml
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: pictures_writers
    ports:
      - "5433:5432"
    volumes:
      - pw_local_db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d pictures_writers"]
      interval: 5s
      timeout: 5s
      retries: 10

  web:
    build:
      context: .
      args:
        DATABASE_URL: postgresql://postgres:postgres@db:5432/pictures_writers?schema=public
        NEXT_PUBLIC_APP_URL: http://localhost:3000
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: ${NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
        NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: ${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY}
    env_file:
      - .env.local
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/pictures_writers?schema=public
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy

volumes:
  pw_local_db:
```

Nota: le migrazioni vengono eseguite dall'entrypoint (`start-production.sh`); il DB parte vuoto e lo schema viene creato. I dati di produzione non ci sono: è solo un test di build/runtime.

---

## 4. GitHub Actions per build ARM + GHCR (opzionale)

Se i build sulla VPS sono troppo lenti o vanno in OOM:

```yaml
name: Build ARM image

on:
  push:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-24.04-arm
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/arm64
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
          build-args: |
            DATABASE_URL=${{ secrets.BUILD_DATABASE_URL }}
            NEXT_PUBLIC_APP_URL=${{ vars.NEXT_PUBLIC_APP_URL }}
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
            NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${{ secrets.NEXT_PUBLIC_RECAPTCHA_SITE_KEY }}
            NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${{ secrets.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY }}
```

> Il build in CI richiede un `DATABASE_URL` raggiungibile da GitHub Actions. Se il DB è solo sulla rete Coolify, non funziona. Opzioni: usare Neon (anche solo per il build), un DB di build pubblico con IP allowlist, o costruire sulla VPS.

---

## 5. Quale scegliere?

| Situazione | Scelta |
|---|---|
| Prima migrazione, vuoi meno sorprese | **Nixpacks** |
| Nixpacks non raggiunge il DB | **B.1 Dockerfile** |
| Vuoi immagine piccola e sai gestire le migrazioni | **B.2 standalone** |
| Build OOM sulla VPS | GitHub Actions ARM + GHCR |
| Deploy da registry aziendale | B.1 o B.2 + Docker Image in Coolify |

In tutti i casi: **una sola replica**, healthcheck, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` stabile.
