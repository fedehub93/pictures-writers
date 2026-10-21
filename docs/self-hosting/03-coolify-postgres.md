# 03 — Coolify, progetto e PostgreSQL

Obiettivo: creare in Coolify il progetto `pictures-writers`, un PostgreSQL **18** (Neon è alla **15.19**; si migra con dump/restore) con volume persistente e backup schedulati, e preparare il database di **staging** partendo da un branch Neon.

> Tutto ciò che segue va fatto **dopo** `02-vps-hardening.md` e prima del deploy dell'app.

---

## 1. Struttura del progetto in Coolify

1. Apri `https://coolify.<DOMAIN>`.
2. **Projects → + Add**:
   - Name: `pictures-writers`
   - Description: `Sito pubblico, admin, shop, email, automazioni`
3. Entra nel progetto e crea l'environment `production` (di solito è già presente) e, se vuoi, `staging`.
4. **+ New Resource** → **Database** → **PostgreSQL**.

In Coolify l'app e il database devono stare:

- nello **stesso progetto**;
- nello **stesso environment** (es. `production`);
- sulla **stessa destination network** (di solito `coolify`).

Solo così il container di build e il container dell'app possono risolvere l'hostname interno del database. Se metti il DB in un progetto e l'app in un altro, il build fallirà con `P1001`/`ENOTFOUND` (vedi `09-troubleshooting.md`).

---

## 2. Creazione di PostgreSQL

### 2.1 Scelta della versione

Prima di creare il DB, controlla la versione di Neon:

```sql
SHOW server_version;
```

Questa guida è stata aggiornata con **Coolify 4.4.6**, che nel selettore offre PostgreSQL **16, 17 e 18** (non più la 15). Per questo progetto si usa **PostgreSQL 18**: è il default, ha il supporto più lungo ed è una major **superiore** a Neon 15.19, quindi il dump si ripristina senza `pg_upgrade`.

Regola generale:

- **Stessa major di Neon** = scelta più sicura, ma non è più disponibile su Coolify.
- Una major superiore (qui 15 → 18) è possibile con dump/restore; qui il rischio è basso perché l'unica estensione è `plpgsql` e la locale è `C`.
- Non usare una major **inferiore** a quella di Neon: `pg_restore` rifiuterebbe il dump.

Usa un container `postgres:18` per `pg_dump`/`pg_restore` (un `pg_dump` più nuovo può leggere un server 15).

**Collation (per questo progetto: `C`):** su Neon i valori rilevati sono:

```sql
SHOW server_encoding;  -- UTF8
SHOW lc_collate;       -- C
SHOW lc_ctype;         -- C
```

Per non cambiare il comportamento di ordinamento e ricerca, crea il Postgres di Coolify con **encoding UTF8 e locale `C`**. Due modi:

1. **Alla creazione del database resource**: in **General → Initial database arguments** scrivi
   ```
   --locale=C --encoding=UTF8
   ```
   Va impostato **prima** del primo avvio: `initdb` applica la locale solo alla creazione del cluster. Se il database viene avviato prima che il campo sia salvato, il cluster nasce con la locale di default dell'immagine (spesso `en_US.utf8`) e il campo non ha più effetto.

2. **Se il container è già inizializzato** con un'altra locale, crea un database applicativo dedicato (senza dati non serve ricreare il resource):
   ```sql
   CREATE DATABASE pictures_writers
     WITH TEMPLATE = template0
          ENCODING = 'UTF8'
          LC_COLLATE = 'C'
          LC_CTYPE = 'C';
   ```
   Poi usa `.../pictures_writers?schema=public` come `DATABASE_URL`, e `pg_restore -d pictures_writers`. Il database `postgres` resta come database di manutenzione; l'app usa solo `pictures_writers`.

   Nota: la URL interna mostrata da Coolify continua a terminare con il database iniziale (`/postgres`) perché il campo è bloccato dopo l'inizializzazione. È solo un'etichetta: host, porta e credenziali sono corretti, cambia il nome del database nel percorso. In alternativa, imposta **Initial database** = `pictures_writers` già nel form di creazione, ma la locale va comunque gestita con il punto 1.

Verifica dopo la creazione:

```sql
SELECT datname,
       pg_encoding_to_char(encoding) AS encoding,
       datcollate,
       datctype
FROM pg_database
WHERE datname IN ('postgres', 'pictures_writers');
```

Atteso: `UTF8 | C | C`.

> `C` e `C.UTF-8` **non** sono la stessa cosa: usa `C` per replicare Neon. `plpgsql` è l'unica estensione presente su Neon ed è installata di default: non devi aggiungere nulla. `gen_random_uuid()` è built-in da PostgreSQL 13, quindi non serve `pgcrypto`.

### 2.2 Creazione

In Coolify:

- **Name**: `pictures-writers-db`
- **Image**: `postgres:18-alpine` (default di Coolify 4.4.6; la 15 non è più nel selettore)
- **Server**: `localhost`
- **Destination network**: la stessa che userà l'app
- **Ports**: **nessuna** pubblicazione. Non abilitare "Public port" / "Accessible over the internet".
- **Persistent storage**: lascia il volume creato automaticamente (es. `/var/lib/postgresql/data`). **Non** cancellarlo mai.
- **Credentials**: Coolify genera utente, password e database. Annotali nel password manager. Imposta **Initial database arguments** come sopra **prima** di Start.
- **Start** il database e attendi lo stato **Running / Healthy**.

### 2.3 URL interno

Nella pagina **General** del database trovi:

- **Postgres URL (internal)** — con hostname interno, es. `postgres-<uuid>:5432`.
- **Postgres URL (public)** — **non usarla** e non abilitarla.

L'URL interno sarà simile a:

```
postgresql://postgres:<DB_PASSWORD>@postgres-<uuid>:5432/postgres?schema=public
```

Questa è la `DATABASE_URL` dell'app **quando app e DB sono sulla stessa rete**. Copiala esattamente (Coolify può aggiungere parametri come `sslmode=disable`: non rimuoverli senza motivo). Se il database applicativo è `pictures_writers`, sostituisci solo la parte finale: `...:5432/pictures_writers?schema=public`.

> Se l'app e il DB sono sulla stessa rete Docker, **non** usare `sslmode=require`. Il traffico non esce dal server.

### 2.4 Tuning memoria (8 GB, opzionale)

Per un DB di blog/CMS di poche centinaia di MB, i default di PostgreSQL 18 sono già adeguati. Con 8 GB puoi dare più cache a Postgres senza togliere memoria all'app:

```bash
# Sulla VPS, entra nel container del DB
docker exec -it <DB_CONTAINER> psql -U postgres -d postgres
```

```sql
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET work_mem = '8MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET max_connections = '100';
```

Poi riavvia il container dal pannello Coolify (o `docker restart <DB_CONTAINER>`). Verifica:

```sql
SHOW shared_buffers;
SHOW max_connections;
```

Non aumentare `max_connections` oltre 100 su 8 GB condivisi con l'app: ogni connessione consuma memoria e il pool `pg` (default 10 connessioni per processo) è già sufficiente.

> **Lascia il timezone del database su UTC** (default di Coolify e di Neon). Prisma mappa `DateTime` su `timestamp` senza timezone e i default `now()` vengono castati usando il timezone della sessione. Cambiarlo può spostare i timestamp. L'app gestisce `Europe/Rome` tramite `Settings.timezone` e `date-fns-tz`.

### 2.5 Verifica connessione dall'app

Dopo aver creato l'app (documento 04), dal terminale del container dell'app:

```bash
node -e "const {Client}=require('pg'); const c=new Client({connectionString:process.env.DATABASE_URL}); c.connect().then(()=>c.query('select version()')).then(r=>{console.log(r.rows[0].version); return c.end()}).catch(e=>{console.error(e); process.exit(1)})"
```

Se funziona, il build e il runtime potranno usare lo stesso URL.

---

## 3. Ripristino del database di staging

Per il collaudo non usare il DB di produzione: usa un **branch Neon** o un dump del branch.

### 3.1 Crea il branch Neon

Nel pannello Neon:

- Seleziona il progetto.
- **Branches → New Branch** → `staging` (copia del branch di produzione).
- Copia la **direct connection string** del branch (non la pooled).

Annota host, database, utente, password.

### 3.2 Dump dal branch

Sulla VPS, crea una cartella per i dump:

```bash
mkdir -p /root/dumps
chmod 700 /root/dumps
```

Crea un file `.pgpass` temporaneo (evita di mettere la password nella history):

```bash
cat > /root/.pgpass <<'EOF'
<NEON_HOST>:5432:<NEON_DB>:<NEON_USER>:<NEON_PASSWORD>
EOF
chmod 600 /root/.pgpass
```

Esegui il dump con un container `postgres:18` (un `pg_dump` più nuovo legge senza problemi il server Neon 15):

```bash
docker run --rm \
  -v /root/dumps:/dumps \
  -v /root/.pgpass:/root/.pgpass:ro \
  -e PGPASSFILE=/root/.pgpass \
  postgres:18 \
  pg_dump \
    -h <NEON_HOST> \
    -U <NEON_USER> \
    -d <NEON_DB> \
    --format=custom \
    --no-owner \
    --no-privileges \
    --verbose \
    --file=/dumps/staging.dump
```

Verifica:

```bash
ls -lh /root/dumps/staging.dump
```

Se il dump è di pochi KB, qualcosa è andato storto: controlla i log.

> **Alternativa:** esegui `pg_dump` da un container già presente sulla VPS (anche quello di Coolify, se è `postgres:18`). Il principio non cambia.

### 3.3 Ripristino nel Postgres di Coolify (via CLI)

Trova il container del DB:

```bash
docker ps --format '{{.Names}}\t{{.Image}}' | grep -i postgres
```

Esempio: `postgres-abc123`.

Copia il dump nel container:

```bash
docker cp /root/dumps/staging.dump <DB_CONTAINER>:/tmp/staging.dump
```

Ripristina:

```bash
docker exec -it <DB_CONTAINER> \
  pg_restore \
    -U postgres \
    -d pictures_writers \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --single-transaction \
    --exit-on-error \
    --verbose \
    /tmp/staging.dump
```

Note:

- `<DB_CONTAINER>`, utente e nome del database devono corrispondere a quelli mostrati nell'URL interno di Coolify. Qui si usa `-U postgres -d pictures_writers`: il database applicativo creato con `TEMPLATE template0` (se hai scelto un altro nome, sostituiscilo). Assicurati che esista già.
- `--clean --if-exists` è sicuro su un DB dedicato e vuoto; se il DB contenesse altre cose, **non** usarlo.
- `--single-transaction` fa rollback completo in caso di errore.
- Se `pg_restore` segnala errori su estensioni o ruoli, controlla `09-troubleshooting.md`.
- Al termine, rimuovi il dump dal container:

```bash
docker exec -it <DB_CONTAINER> rm -f /tmp/staging.dump
rm -f /root/dumps/staging.dump
rm -f /root/.pgpass
```

### 3.4 Ripristino via interfaccia Coolify (alternativa)

Coolify ha **Import Backup** nella pagina del database:

- accetta un file dal computer, un path assoluto sul server o un oggetto S3;
- rileva il formato (`pg_restore` per custom, `psql` per plain);
- mostra il comando di restore prima di eseguirlo.

Per un dump custom è equivalente alla CLI. Usa l'interfaccia se preferisci, ma **leggi il comando** prima di confermare: il restore sostituisce i dati del database di destinazione.

### 3.5 Verifica del restore

```bash
docker exec -it <DB_CONTAINER> psql -U postgres -d pictures_writers
```

```sql
-- Tabelle principali
\dt

-- Migrazioni applicate
SELECT migration_name, finished_at
FROM "_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 10;

-- Conteggi di controllo (i nomi sono PascalCase, con virgolette)
SELECT 'User' AS table, count(*) FROM "User"
UNION ALL SELECT 'PostRoot', count(*) FROM "PostRoot"
UNION ALL SELECT 'PageRoot', count(*) FROM "PageRoot"
UNION ALL SELECT 'ProductRoot', count(*) FROM "ProductRoot"
UNION ALL SELECT 'Media', count(*) FROM "Media"
UNION ALL SELECT 'EmailContact', count(*) FROM "EmailContact"
UNION ALL SELECT 'FormSubmission', count(*) FROM "FormSubmission"
UNION ALL SELECT 'ScheduledAction', count(*) FROM "ScheduledAction";

-- Impostazioni del sito (siteUrl, timezone)
SELECT "siteUrl", "siteName", "timezone" FROM "Settings" LIMIT 1;

-- Integrazioni presenti (senza decifrare i segreti)
SELECT provider, "isEnabled" FROM "Integration";
```

Se `_prisma_migrations` è vuota o manca, il dump non è completo: non proseguire.

---

## 4. Backup schedulati (fondamentale)

Neon offre point-in-time recovery; un Postgres self-hosted no. Devi costruire tu la rete di sicurezza.

### 4.1 S3 compatibile

Puoi partire con i soli backup **locali** e aggiungere S3 alla stessa schedule quando il bucket è pronto: non serve ricreare nulla. I backup locali però non sopravvivono alla perdita della VPS, quindi S3 va aggiunto prima del cutover.

Crea un bucket su uno di questi:

- **Cloudflare R2** — 10 GB gratis, poi ~$0,015/GB/mese. Ottimo per un DB piccolo.
- **Backblaze B2** — ~$6/TB/mese, pochi centesimi per questo DB.
- **Hetzner Object Storage** — comodo se vuoi tutto su Hetzner.

Crea un bucket **privato** e credenziali con permessi di lettura/scrittura solo su quel bucket.

In Coolify: **S3 Storage → New storage**:

- Name: `pictures-writers-backups`
- Bucket, Region, Endpoint, Access Key, Secret Key
- **Validate Connection & Continue**

### 4.2 Schedule di backup

Apri il database → **Backups → + Add**:

- Frequency: `0 3 * * *` (ogni giorno alle 03:00, ora del server).
- Database selection: **Specific databases** → **Databases to back up**: `pictures_writers`. Non scegliere "All databases" se vuoi un dump per l'app: con PostgreSQL selezionato, "All databases" usa `pg_dumpall`.
- **Enable S3**: seleziona lo storage creato (quando disponibile).
- **Local copy**: puoi tenerla 2–3 giorni e cancellarla dopo l'upload S3.
- Retention:
  - S3: 7–14 giorni (o 7 daily + 4 weekly se disponibile).
  - Locale: 7 copie / 7 giorni (0 = nessun limite).
- Timeout: 3600 s (default) va bene.

Esegui **Back up now** e verifica:

- stato **Success**;
- dimensione > 0;
- upload S3 riuscito (se abilitato);
- il file è presente nel bucket.

I backup locali finiscono in `/data/coolify/backups/<team>/<database>/...`. Per trovare il più recente:

```bash
find /data/coolify/backups -type f -printf '%TY-%Tm-%Td %TH:%TM  %s  %p\n' | sort
```

### 4.3 Test di restore (obbligatorio)

Un backup non testato non è un backup. Almeno una volta:

1. Scarica il dump dal bucket (o dalla cartella locale `/data/coolify/backups`, finché S3 non è attivo).
2. Crea un database **usa-e-getta** (anche un altro container Postgres temporaneo `postgres:18`).
3. Ripristinalo con `pg_restore`.
4. Apri l'app in staging puntandola a quel DB e verifica login + una pagina + un prodotto.
5. Cancella il DB di test.

Ripeti il test ogni 3 mesi o dopo ogni cambio importante di schema.

### 4.4 Secondo livello: backup Hetzner

Se hai attivato i backup Hetzner, hai anche uno snapshot dell'intera VPS (disco, Docker, volumi). Non sostituisce il dump SQL (ripristinare un'intera VPS è più lento), ma copre il caso "ho rotto il server".

### 4.5 Cosa NON è coperto

- File di UploadThing (sono su UploadThing; verifica la loro politica di backup/retention).
- Segreti cifrati nel DB: servono `SECRETS_ENCRYPTION_KEY` e `AUTOMATION_CREDENTIALS_KEY` **insieme** al dump. Senza, le integrazioni non si decifrano.
- Configurazione di Coolify: `/data/coolify/source/.env` e il volume di Coolify. Salvali a parte.

---

## 5. Backup della configurazione Coolify

Oltre al DB dell'app, devi poter ricreare Coolify:

```bash
# Segreti di installazione (APP_KEY, ecc.)
cat /data/coolify/source/.env

# Elenco volumi e container
docker volume ls
docker ps -a
```

Salva il contenuto di `/data/coolify/source/.env` nel password manager. Coolify ha una propria procedura di backup/restore: seguila dalla documentazione ufficiale e testala. Se perdi `APP_KEY`, le variabili d'ambiente cifrate di Coolify diventano illeggibili.

---

## 6. Rete: cosa deve essere vero

Prima di passare al deploy, verifica:

- [ ] App e DB sono nello stesso progetto/environment.
- [ ] App e DB sono sulla stessa destination network.
- [ ] Il DB **non** ha una porta pubblica.
- [ ] L'URL interno del DB è copiato correttamente.
- [ ] Il DB è **Healthy**.
- [ ] Il restore di staging è completo (`_prisma_migrations` presente).
- [ ] Il backup schedulato è configurato e testato.
- [ ] Le notifiche Coolify sono attive.

---

## 7. Comandi utili

```bash
# Container del database
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}' | grep -i postgres

# Log del database
docker logs --tail=200 <DB_CONTAINER>

# Shell psql
docker exec -it <DB_CONTAINER> psql -U postgres -d postgres

# Dimensione del database
docker exec -it <DB_CONTAINER> psql -U postgres -d postgres -c \
  "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Elenco backup locali creati da Coolify
ls -lh /data/coolify/backups/ 2>/dev/null || true

# Spazio disco
df -h /
docker system df
```

---

## 8. Errori tipici in questa fase

| Sintomo | Causa | Rimedio |
|---|---|---|
| `P1001: Can't reach database server` | App e DB su reti diverse, o hostname sbagliato | Stessa destination network; usa l'URL interno |
| `ENOTFOUND postgres-...` | Build container fuori dalla rete | Vedi `04-deploy-applicazione.md` §7 |
| `pg_restore: error: unrecognized configuration parameter` | Versione `pg_restore` più vecchia del dump | Usa `postgres:18` (o la major corretta) |
| `role "..." does not exist` | Dump con owner originali | Usa `--no-owner --no-privileges` |
| `database "..." already exists` | Restore su DB non vuoto | Crea un DB nuovo o usa `--clean --if-exists` con cautela |
| `datcollate = en_US.utf8` | Il cluster è stato inizializzato prima degli init args | Crea il DB applicativo con `TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'` |
| Backup S3 fallisce | Bucket/credenziali/endpoint errati | Valida lo storage in Coolify; controlla i log |
