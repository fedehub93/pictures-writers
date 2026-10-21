# 05 — Migrazione del database da Neon a PostgreSQL locale

Questo è il passaggio più delicato. Lo fai **solo dopo** che l'app gira stabilmente sulla VPS usando ancora Neon (fase B) e dopo aver completato il collaudo.

Obiettivo: spostare tutti i dati da Neon al PostgreSQL gestito da Coolify, con una finestra di manutenzione breve e un rollback chiaro.

---

## 1. Principi

1. **Nessuna scrittura durante il dump finale.** Altrimenti perdi tutto ciò che viene scritto tra il dump e lo switch.
2. **Un solo dump finale**, non una serie di dump incrementali fatti a mano.
3. **Verifica prima di cambiare `DATABASE_URL`.** Se il restore è incompleto, non avviare l'app sul DB nuovo.
4. **Neon resta intatto** per almeno 30 giorni. Non cancellarlo subito.
5. **Rollback immediato**: se qualcosa va storto prima che l'app scriva sul DB nuovo, riusi Neon e torni online in pochi minuti.

---

## 2. Pre-flight (giorni prima)

- [ ] La fase B (VPS + Neon) è stabile da almeno 24–72 ore.
- [ ] Il Postgres locale è **Healthy**.
- [ ] Hai un backup recente e **testato** del DB locale (anche vuoto).
- [ ] Hai un branch Neon `pre-cutover` o uno snapshot.
- [ ] Hai spazio disco: `df -h /` almeno 5–10 GB liberi.
- [ ] Conosci la versione di Neon (`SHOW server_version`) e la major del Postgres locale.
- [ ] Hai la stringa **direct** di Neon (non pooled) salvata in modo sicuro.
- [ ] Hai la stringa **internal** del Postgres Coolify.
- [ ] Hai annunciato la finestra di manutenzione (se il sito ha traffico).
- [ ] Hai stampato `checklist-finale.md`.
- [ ] Scegli un orario di basso traffico (notte italiana, se il pubblico è italiano).

### 2.1 Stima dei tempi

| Dimensione DB | Dump | Restore | Totale finestra |
|---|---:|---:|---:|
| < 50 MB | < 10 s | < 30 s | 2–5 min |
| 50–200 MB | 10–30 s | 1–2 min | 5–10 min |
| 200 MB–1 GB | 30 s–2 min | 2–8 min | 10–20 min |
| > 1 GB | 2–10 min | 10–30 min | 30–60 min |

Aggiungi il tempo di restart e verifica. Il build **non** è incluso se usi l'immagine già pronta (vedi §3).

### 2.2 Preparare l'immagine prima della finestra

Per ridurre il downtime:

1. Fai un deploy **di prova** con il codice attuale e `DATABASE_URL` puntato a Neon.
2. Verifica che l'immagine sia costruita e che il container sia sano.
3. Durante la finestra **non ricostruire** l'immagine: cambia solo `DATABASE_URL` e riavvia.
4. Dopo il riavvio, se vuoi, fai un redeploy rolling (senza downtime) per rigenerare le pagine statiche contro il DB locale.

`DATABASE_URL` è una variabile **runtime** per Next.js: non è cotta nel bundle. Quindi il cambio non richiede un nuovo build.

---

## 3. Finestra di manutenzione: procedura

### 3.1 Fermare le scritture

In Coolify: applicazione → **Stop** (oppure riduci le repliche a 0, se disponibile).

Verifica che non ci siano connessioni attive al DB di Neon:

```sql
-- Su Neon
SELECT count(*) FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid();
```

Se l'app è ferma, il conteggio deve essere 0 (o solo connessioni di monitoraggio).

> Il sito restituirà un errore (502/503) finché l'app è ferma. È la finestra di manutenzione. Se vuoi una pagina dedicata, puoi metterla su Cloudflare o su un piccolo container statico, ma non è obbligatorio.

### 3.2 Dump finale da Neon (direct)

Sulla VPS:

```bash
mkdir -p /root/dumps
chmod 700 /root/dumps
```

Crea `.pgpass` (permessi 600):

```bash
cat > /root/.pgpass <<'EOF'
<NEON_HOST>:5432:<NEON_DB>:<NEON_USER>:<NEON_PASSWORD>
EOF
chmod 600 /root/.pgpass
```

Esegui il dump (il container `postgres:18` contiene un `pg_dump` più nuovo, che legge senza problemi Neon 15):

```bash
STAMP=$(date +%Y%m%d-%H%M%S)

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
    --compress=9 \
    --no-owner \
    --no-privileges \
    --verbose \
    --file=/dumps/neon-final-$STAMP.dump
```

Verifica:

```bash
ls -lh /root/dumps/neon-final-*.dump

# Il dump deve contenere la tabella delle migrazioni
docker run --rm \
  -v /root/dumps:/dumps \
  postgres:18 \
  pg_restore --list /dumps/neon-final-$STAMP.dump | grep _prisma_migrations
```

Se `_prisma_migrations` non compare, **fermati**.

> **Consiglio:** calcola anche un checksum del file e salvalo:
> ```bash
> sha256sum /root/dumps/neon-final-$STAMP.dump | tee /root/dumps/neon-final-$STAMP.sha256
> ```
> Se copi il dump altrove, verificalo con `sha256sum -c`.

### 3.3 Ripristino nel Postgres locale

Trova il container:

```bash
docker ps --format '{{.Names}}\t{{.Image}}' | grep -i postgres
```

Copia il dump dentro il container:

```bash
docker cp /root/dumps/neon-final-$STAMP.dump <DB_CONTAINER>:/tmp/neon-final.dump
```

Ripristina:

```bash
docker exec -it <DB_CONTAINER> \
  pg_restore \
    -U postgres \
    -d postgres \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --single-transaction \
    --exit-on-error \
    --verbose \
    /tmp/neon-final.dump
```

Note:

- Utente e nome del database devono corrispondere all'URL interno di Coolify. I comandi usano `-U postgres -d postgres` (default Coolify); se hai scelto un altro nome, sostituiscilo.
- `--clean --if-exists` elimina gli oggetti esistenti nel DB di destinazione. Se il DB locale contiene dati di test, è ciò che vuoi. Se contiene qualcosa che non vuoi perdere, **fermati e fai un backup**.
- `--single-transaction` garantisce che un errore annulli tutto: non resti con un DB a metà.
- Se il restore fallisce per connessioni attive, assicurati che l'app sia ferma e riprova.
- Se il DB è molto grande, `--single-transaction` può richiedere molta memoria/wal; in tal caso togli `--single-transaction` e usa `--exit-on-error`, poi verifica.

Al termine:

```bash
docker exec -it <DB_CONTAINER> rm -f /tmp/neon-final.dump
```

### 3.4 Verifica **prima** di cambiare l'app

```bash
docker exec -it <DB_CONTAINER> psql -U postgres -d postgres
```

```sql
-- 1. Migrazioni
SELECT migration_name, finished_at
FROM "_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 10;

-- 2. Conteggi principali
SELECT 'User' AS table, count(*) FROM "User"
UNION ALL SELECT 'PostRoot', count(*) FROM "PostRoot"
UNION ALL SELECT 'PostVersion', count(*) FROM "PostVersion"
UNION ALL SELECT 'PageRoot', count(*) FROM "PageRoot"
UNION ALL SELECT 'PageVersion', count(*) FROM "PageVersion"
UNION ALL SELECT 'ProductRoot', count(*) FROM "ProductRoot"
UNION ALL SELECT 'ProductVersion', count(*) FROM "ProductVersion"
UNION ALL SELECT 'Category', count(*) FROM "Category"
UNION ALL SELECT 'Tag', count(*) FROM "Tag"
UNION ALL SELECT 'Media', count(*) FROM "Media"
UNION ALL SELECT 'Form', count(*) FROM "Form"
UNION ALL SELECT 'FormSubmission', count(*) FROM "FormSubmission"
UNION ALL SELECT 'EmailAudience', count(*) FROM "EmailAudience"
UNION ALL SELECT 'EmailContact', count(*) FROM "EmailContact"
UNION ALL SELECT 'EmailMessage', count(*) FROM "EmailMessage"
UNION ALL SELECT 'Automation', count(*) FROM "Automation"
UNION ALL SELECT 'AutomationRun', count(*) FROM "AutomationRun"
UNION ALL SELECT 'ScheduledAction', count(*) FROM "ScheduledAction"
UNION ALL SELECT 'Purchase', count(*) FROM "Purchase"
ORDER BY table;

-- 3. Impostazioni
SELECT "siteName", "siteUrl", "timezone" FROM "Settings" LIMIT 1;

-- 4. Integrazioni (non decifra i segreti)
SELECT provider, "isEnabled", "updatedAt" FROM "Integration";

-- 5. Ultimi contenuti pubblicati
SELECT id, slug, status FROM "PostVersion" ORDER BY "updatedAt" DESC LIMIT 5;
```

Confronta i conteggi con Neon:

```sql
-- Su Neon, stessi conteggi
SELECT 'User' AS table, count(*) FROM "User"
UNION ALL SELECT 'PostRoot', count(*) FROM "PostRoot"
-- ... ecc.
ORDER BY table;
```

Se un conteggio differisce, indaga **prima** di proseguire.

Aggiorna le statistiche:

```sql
ANALYZE;
```

### 3.5 Cambiare `DATABASE_URL`

In Coolify → applicazione → **Environment Variables**:

```dotenv
DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@postgres-<uuid>:5432/postgres?schema=public
```

Salva. Poi:

- **Restart** (basta per applicare una variabile runtime), oppure
- **Deploy** se vuoi ricostruire subito.

Consiglio: **Restart** per tornare online in fretta, poi un **Deploy** rolling per rigenerare le pagine statiche.

### 3.6 Avvio e verifica

Avvia l'app e guarda i log:

- `prisma migrate deploy` deve dire "No pending migrations" (o applicare solo eventuali migrazioni nuove);
- `Ready on http://0.0.0.0:3000`;
- healthcheck **Healthy**.

Verifica che l'app stia leggendo il DB locale:

```bash
# Nel terminale del container app
node -e "const {Client}=require('pg'); const c=new Client({connectionString:process.env.DATABASE_URL}); c.connect().then(()=>c.query('select current_database(), inet_server_addr()')).then(r=>{console.log(r.rows[0]); return c.end()})"
```

`inet_server_addr()` deve essere l'IP del container Postgres sulla rete Docker, non un IP Neon.

Poi:

- apri la home;
- fai login admin;
- apri un post;
- apri un prodotto;
- verifica che i conteggi nell'admin siano corretti.

### 3.7 Redeploy rolling (consigliato)

Dopo che il sito è online e verificato, fai un **Deploy** (rolling):

- Coolify costruisce la nuova immagine mentre il container attuale serve;
- il nuovo container esegue le migrazioni (no-op) e parte;
- healthcheck;
- switch.

Questo rigenera le pagine statiche contro il DB locale e rimuove ogni residuo del build fatto con Neon. È un passaggio senza downtime se il healthcheck è configurato.

### 3.8 Pulizia

Solo dopo 24–72 ore di monitoraggio:

```bash
rm -f /root/dumps/neon-final-*.dump
rm -f /root/.pgpass
```

Conserva però il dump su S3 o su un disco cifrato per almeno 30 giorni: è il tuo rollback.

---

## 4. Rollback

### 4.1 Rollback durante la finestra (prima che l'app scriva sul DB locale)

Se il restore o le verifiche falliscono:

1. Non avviare l'app sul DB locale.
2. In Coolify, rimetti `DATABASE_URL` all'URL Neon.
3. Avvia l'app.
4. Il sito torna online con i dati di Neon, che non sono stati toccati.

Nessun dato perso: l'app è rimasta ferma e Neon è intatto.

### 4.2 Rollback dopo che l'app ha scritto sul DB locale

Qui non è più un semplice switch: i dati nuovi sono nel DB locale, non in Neon.

Opzioni:

1. **Riparare la VPS** (la strada normale). Il DB locale è la fonte di verità.
2. **Esportare il DB locale e ripristinarlo su Neon**, poi tornare a Neon. Richiede un dump del DB locale e un restore su Neon; è fattibile ma più lungo.
3. Ripristinare il dump `neon-final` su Neon e accettare la perdita delle scritture successive (sconsigliato).

Documenta sempre l'orario esatto dello switch. Se qualcosa va storto, sai quali dati sono solo locali.

### 4.3 Rollback dell'app (DNS)

Nella fase B (VPS + Neon) il rollback è banale: riporta il DNS su Vercel. Dopo la fase C (DB locale), Vercel non è più allineato: non usarlo come rollback del database.

---

## 5. Verifiche di integrità avanzate

### 5.1 Confronto conteggi automatizzato

Sulla VPS, con il dump Neon ancora disponibile o con una connessione direct:

```bash
QUERY="
SELECT 'User' t, count(*) FROM \"User\"
UNION ALL SELECT 'PostRoot', count(*) FROM \"PostRoot\"
UNION ALL SELECT 'PageRoot', count(*) FROM \"PageRoot\"
UNION ALL SELECT 'ProductRoot', count(*) FROM \"ProductRoot\"
UNION ALL SELECT 'EmailContact', count(*) FROM \"EmailContact\"
ORDER BY t;"

# Neon
docker run --rm -v /root/.pgpass:/root/.pgpass:ro -e PGPASSFILE=/root/.pgpass \
  postgres:18 psql -h <NEON_HOST> -U <NEON_USER> -d <NEON_DB> -At -F '|' -c "$QUERY" \
  > /root/dumps/neon-counts.txt

# Locale
docker exec -i <DB_CONTAINER> psql -U postgres -d postgres -At -F '|' -c "$QUERY" \
  > /root/dumps/local-counts.txt

diff -u /root/dumps/neon-counts.txt /root/dumps/local-counts.txt && echo "COUNTS OK"
```

### 5.2 Checksum di tabelle piccole

Per tabelle critiche e piccole (Settings, Role, Permission, Integration):

```sql
SELECT md5(string_agg(t::text, '' ORDER BY t.id)) FROM "Settings" t;
SELECT md5(string_agg(t::text, '' ORDER BY t.id)) FROM "Role" t;
SELECT md5(string_agg(t::text, '' ORDER BY t.id)) FROM "Permission" t;
SELECT md5(string_agg(t::text, '' ORDER BY t.id)) FROM "Integration" t;
```

Confronta i risultati tra Neon e locale. Attenzione: i timestamp possono avere rappresentazioni identiche se il dump è fedele; in caso di differenze, indaga.

### 5.3 Integrità referenziale

```sql
-- Foreign key non validate? (Postgres le valida al restore)
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE contype = 'f' AND NOT convalidated;
```

Se il restore è andato a buon fine, non dovrebbe restituire righe.

### 5.4 Bloat / vacuum

```sql
VACUUM (ANALYZE);
```

Su un DB piccolo è veloce. Se il DB è grande, eseguilo fuori dalla finestra.

---

## 6. Dopo il cutover: cosa monitorare per 72 ore

- Errori nei log dell'app (`docker logs`, Coolify runtime logs).
- Errori `P1001`, `P2024` (pool timeout), `too many connections`.
- Latenza delle query (Coolify non la mostra; usa `pg_stat_statements` se serve).
- Spazio disco e crescita del DB.
- Job schedulati: `/api/scheduler/run/` e `/api/automations/run/` rispondono 200.
- Email in uscita e inbound.
- Checkout Stripe (con una carta di test).
- Backup notturno: il primo backup dopo il cutover deve riuscire.

---

## 7. Ottimizzazioni future (non ora)

- **WAL archiving / PITR**: con PostgreSQL locale puoi configurare `pgBackRest` o `WAL-G` per il point-in-time recovery. È il corrispettivo di ciò che offriva Neon. Richiede un bucket S3 e un po' di setup. Rimandalo a quando il sistema è stabile.
- **Réplica di lettura**: non necessaria per un singolo sito.
- **Connessione pooler**: l'app usa `pg` con pool per processo; con una sola istanza va bene.
- **`pg_stat_statements`**: utile per individuare query lente dopo qualche settimana.
- **Storage dei file**: se vuoi eliminare anche UploadThing, valuta MinIO/S3 + migrazione degli URL nel DB. Progetto separato.

---

## 8. Errori tipici

| Sintomo | Causa | Rimedio |
|---|---|---|
| `pg_restore: error: connection to server ... failed` | Container DB fermo o hostname errato | Verifica `docker ps`, URL interno |
| `database is being accessed by other users` | App ancora connessa | Ferma l'app, chiudi le sessioni |
| `role "neon_user" does not exist` | Mancato `--no-owner` | Rifai il restore con `--no-owner` |
| `permission denied for schema public` | Utente DB non proprietario | Usa `postgres` o concedi i permessi |
| Conteggi diversi | Dump fatto con app in scrittura | Rifai il dump con l'app ferma |
| `_prisma_migrations` vuota | Dump incompleto / restore parziale | Non proseguire; rifai dump e restore |
| App online ma dati vecchi | Cache ISR del build Neon | Redeploy rolling |
| `too many connections` | Pool + connessioni residue | Riavvia app; controlla `pg_stat_activity` |
| Migrazioni pendenti dopo lo switch | Immagine vecchia / start command errato | Verifica `prisma migrate status` |
