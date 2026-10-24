# Appendice C — Comandi copia-incolla

Raccolta operativa. Sostituisci `<...>` con i tuoi valori. Non incollare segreti in terminali condivisi o log.

---

## 1. Dal tuo PC (Windows PowerShell)

### Chiave SSH

```powershell
ssh-keygen -t ed25519 -C "pictures-writers-vps" -f "$env:USERPROFILE\.ssh\pictures-writers"
Get-Content "$env:USERPROFILE\.ssh\pictures-writers.pub" | Set-Clipboard
```

### Connessione

```powershell
ssh -i "$env:USERPROFILE\.ssh\pictures-writers" root@<VPS_IP>
```

### DNS

```powershell
Resolve-DnsName <DOMAIN> -Type A
Resolve-DnsName <DOMAIN> -Type AAAA
Resolve-DnsName www.<DOMAIN> -Type A
Resolve-DnsName <DOMAIN> -Type NS
Resolve-DnsName <DOMAIN> -Server 1.1.1.1 -Type A
```

Se hai `dig` (WSL/Git Bash):

```bash
dig +short <DOMAIN> A
dig +short <DOMAIN> AAAA
dig +short www.<DOMAIN> A
dig NS <DOMAIN> +short
dig @1.1.1.1 +short <DOMAIN> A
```

### Vercel

```powershell
npm i -g vercel
vercel login
vercel link
vercel env ls production
vercel env pull .env.production --environment=production
```

> Cancella `.env.production` dopo l'uso e verifica `git status`.

### Test HTTP

```powershell
curl.exe -I https://<DOMAIN>/
curl.exe -I https://<DOMAIN>/sitemap.xml
curl.exe -I https://<DOMAIN>/robots.txt
```

---

## 2. VPS: sistema

```bash
# Identità
hostnamectl
uname -a
uname -m
cat /etc/os-release

# Risorse
free -h
df -h /
nproc
uptime

# Swap
swapon --show

# Timezone
timedatectl

# Firewall
ufw status verbose
fail2ban-client status sshd

# Porte
ss -tulpn
```

### Aggiornamenti

```bash
apt update
apt -y upgrade
apt -y autoremove
```

### Swap (se manca)

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl -w vm.swappiness=10
```

---

## 3. Docker e Coolify

```bash
# Container
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'

# Log
docker logs --tail=200 <CONTAINER>
docker logs -f <CONTAINER>

# Risorse
docker stats --no-stream

# Spazio
docker system df
du -sh /var/lib/docker/* 2>/dev/null | sort -h | tail

# Volumi
docker volume ls
docker volume inspect <VOLUME>

# Reti
docker network ls
docker network inspect coolify

# Coolify
cd /data/coolify/source
docker compose ps
docker compose up -d
docker compose logs --tail=100

# Segreti di installazione
cat /data/coolify/source/.env
```

### Pulizia sicura

```bash
docker image prune -f
docker builder prune -f
docker container prune -f
# NON usare --volumes senza aver verificato i volumi
```

---

## 4. PostgreSQL

### Trovare il container

```bash
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}' | grep -i postgres
```

### Shell

```bash
docker exec -it <DB_CONTAINER> psql -U postgres -d postgres
```

### Query utili

```sql
-- Versione
SHOW server_version;
SELECT version();

-- Encoding e locale del database
SELECT datname,
       pg_encoding_to_char(encoding) AS encoding,
       datcollate,
       datctype
FROM pg_database
WHERE datname = current_database();

-- Dimensione
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Tabelle più grandi
SELECT relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 15;

-- Connessioni
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
SELECT pid, state, query_start, left(query, 120)
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_start;

-- Migrazioni
SELECT migration_name, finished_at
FROM "_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 10;

-- Conteggi
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

-- Impostazioni
SELECT "siteName", "siteUrl", "timezone" FROM "Settings" LIMIT 1;

-- Integrazioni
SELECT provider, "isEnabled", "updatedAt" FROM "Integration";

-- Scheduled actions
SELECT id, type, status, "scheduledAt", "retryAt", "lastError"
FROM "ScheduledAction"
ORDER BY "createdAt" DESC
LIMIT 20;

-- Analisi
ANALYZE;
VACUUM (ANALYZE);
```

### Dump da Neon

```bash
mkdir -p /root/dumps
chmod 700 /root/dumps

cat > /root/.pgpass <<'EOF'
<NEON_HOST>:5432:<NEON_DB>:<NEON_USER>:<NEON_PASSWORD>
EOF
chmod 600 /root/.pgpass

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
    --file=/dumps/neon-$STAMP.dump

sha256sum /root/dumps/neon-$STAMP.dump | tee /root/dumps/neon-$STAMP.sha256
docker run --rm -v /root/dumps:/dumps postgres:18 \
  pg_restore --list /dumps/neon-$STAMP.dump | grep _prisma_migrations
```

### Restore

```bash
docker cp /root/dumps/neon-$STAMP.dump <DB_CONTAINER>:/tmp/restore.dump

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
    /tmp/restore.dump

docker exec -it <DB_CONTAINER> rm -f /tmp/restore.dump
```

### Terminare connessioni

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid();
```

---

## 5. Prisma (nel container app)

```bash
docker exec -it <APP_CONTAINER> npx prisma migrate status
docker exec -it <APP_CONTAINER> npx prisma migrate deploy
docker exec -it <APP_CONTAINER> npx prisma -v
```

Test connessione DB:

```bash
docker exec <APP_CONTAINER> node -e "const {Client}=require('pg'); const c=new Client({connectionString:process.env.DATABASE_URL}); c.connect().then(()=>c.query('select current_database(), inet_server_addr()')).then(r=>{console.log(r.rows[0]); return c.end()}).catch(e=>{console.error(e); process.exit(1)})"
```

---

## 6. App: salute e log

```bash
# HTTP
curl -s -o /dev/null -w "%{http_code} ttfb=%{time_starttransfer} total=%{time_total}\n" https://<DOMAIN>/
curl -s -o /dev/null -w "%{http_code}\n" https://<DOMAIN>/api/health

# Log errori
docker logs --since 1h <APP_CONTAINER> 2>&1 | grep -iE 'error|exception|fatal|P1001|P2021|P2024' | tail -50

# Env (senza stampare segreti)
docker exec <APP_CONTAINER> printenv | sort | grep -E \
  '^(NODE_ENV|PORT|HOSTNAME|TZ|NEXT_PUBLIC_APP_URL|BETTER_AUTH_URL)='

# Processi
docker top <APP_CONTAINER>
```

---

## 6bis. Media: backfill metadati e rendition

```bash
# Anteprima metadati (legge le sorgenti, non scrive)
docker exec -it <APP_CONTAINER> env MEDIA_BACKFILL_DRY_RUN=1 \
  npm run media:backfill-metadata

# Backfill metadati (finestra di basso traffico)
docker exec -it <APP_CONTAINER> env MEDIA_BACKFILL_CONCURRENCY=4 \
  npm run media:backfill-metadata

# Anteprima rendition (elenca le Media in attesa, non legge né scrive)
docker exec -it <APP_CONTAINER> env MEDIA_BACKFILL_DRY_RUN=1 \
  npm run media:backfill-renditions

# Backfill rendition (dopo i metadati, finestra di basso traffico)
docker exec -it <APP_CONTAINER> env MEDIA_RENDITION_BACKFILL_CONCURRENCY=2 \
  npm run media:backfill-renditions
```

Il report finale è JSON: `processed` = immagini completate, `skipped` = già elaborate, `failed` = sorgenti con il motivo. Dettagli in `docs/self-hosting/08-operations-runbook.md`, sezione 4bis.

---

## 7. TLS

```bash
curl -I https://<DOMAIN>/

echo | openssl s_client -servername <DOMAIN> -connect <DOMAIN>:443 2>/dev/null \
  | openssl x509 -noout -issuer -subject -dates

# Scadenza in giorni
echo | openssl s_client -servername <DOMAIN> -connect <DOMAIN>:443 2>/dev/null \
  | openssl x509 -noout -enddate

# Traefik
docker ps --format '{{.Names}}' | grep -i traefik
docker logs <TRAEFIK_CONTAINER> 2>&1 | tail -100
```

---

## 8. Cron (scheduler e automazioni)

```bash
# Scheduler
curl -i -X POST https://<DOMAIN>/api/scheduler/run/ \
  -H "x-scheduled-publication-secret: <SCHEDULED_PUBLICATION_SECRET>"

# Automazioni
curl -i -X POST https://<DOMAIN>/api/automations/run/ \
  -H "x-scheduled-publication-secret: <SCHEDULED_PUBLICATION_SECRET>"
```

Risposte attese: **200** con JSON. **401** = secret errato. **500** = errore applicativo/DB.

### Cron della VPS (alternativa a cron-job.org)

Crea `/root/pw-cron/pump.sh` (permessi 700):

```bash
#!/bin/sh
set -eu
SECRET_FILE=/root/pw-cron/secret
SECRET=$(cat "$SECRET_FILE")
curl -fsS -m 60 -X POST "https://<DOMAIN>/api/scheduler/run/" \
  -H "x-scheduled-publication-secret: $SECRET" >/dev/null
curl -fsS -m 60 -X POST "https://<DOMAIN>/api/automations/run/" \
  -H "x-scheduled-publication-secret: $SECRET" >/dev/null
```

```bash
chmod 700 /root/pw-cron /root/pw-cron/pump.sh
printf '%s' '<SECRET>' > /root/pw-cron/secret
chmod 600 /root/pw-cron/secret

crontab -e
# aggiungi:
# */5 * * * * /root/pw-cron/pump.sh >> /var/log/pw-cron.log 2>&1
```

Verifica:

```bash
tail -n 50 /var/log/pw-cron.log
```

> Se usi cron-job.org, non attivare anche il cron della VPS: raddoppieresti le chiamate (le lease proteggono, ma è inutile).

---

## 9. Webhook

```bash
# Stripe (senza firma → 400 atteso)
curl -i -X POST https://<DOMAIN>/api/webhooks/stripe/ \
  -H "Content-Type: application/json" -d '{}'

# Resend (senza header → 400 atteso)
curl -i -X POST https://<DOMAIN>/api/webhooks/resend/ \
  -H "Content-Type: application/json" -d '{}'

# Automazione custom
curl -i -X POST https://<DOMAIN>/api/automations/webhook/<ID>/ \
  -H "x-automation-secret: <SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"test":true}'
```

---

## 10. Backup: verifica e restore test

```bash
# Backup Coolify locali
ls -lh /data/coolify/backups/ 2>/dev/null

# Ultimo backup
find /data/coolify/backups -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -5

# Test restore in un container usa-e-getta
docker run -d --name pw-restore-test -e POSTGRES_PASSWORD=test -p 127.0.0.1:55432:5432 postgres:18
sleep 5
docker cp /path/backup.dump pw-restore-test:/tmp/backup.dump
docker exec -it pw-restore-test pg_restore -U postgres -d postgres \
  --no-owner --no-privileges --clean --if-exists /tmp/backup.dump
docker exec -it pw-restore-test psql -U postgres -d postgres -c \
  'SELECT count(*) FROM "_prisma_migrations";'
docker rm -f pw-restore-test
```

---

## 11. Emergenza

### Sito giù: triage in 60 secondi

```bash
date
uptime
free -h
df -h /
docker ps --format '{{.Names}}\t{{.Status}}'
docker logs --tail=80 <APP_CONTAINER>
docker logs --tail=40 <DB_CONTAINER>
curl -s -o /dev/null -w "%{http_code} %{time_total}\n" https://<DOMAIN>/
```

### Riavvio app

```bash
# Da Coolify (preferito) oppure:
docker restart <APP_CONTAINER>
```

### Riavvio DB

```bash
docker restart <DB_CONTAINER>
```

### Rollback immagine

Coolify → applicazione → **Deployments/Rollbacks** → deployment precedente → **Rollback**.

### Rollback DNS

Riporta i record A/CNAME ai valori Vercel annotati; attendi il TTL.

---

## 12. Snapshot e ripristino Hetzner

```bash
# Non si fa da CLI: usa la console Hetzner
# Server → Snapshots → Create snapshot
# Server → Backups → Restore
```

Prima di un aggiornamento importante:

1. Snapshot Hetzner.
2. Backup DB su S3.
3. Annota la versione di Coolify.
4. Aggiorna.
5. Verifica.

---

## 13. Pulizia file temporanei

```bash
rm -f /root/dumps/*.dump
rm -f /root/.pgpass
rm -f /root/pw-cron/secret   # solo se dismetti il cron
```

Conserva almeno un dump cifrato off-site per 30 giorni.
