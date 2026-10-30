# Appendice D — GUI per il database, in sicurezza

Come leggere e modificare i dati con un programma grafico (come facevi con Neon) **senza esporre PostgreSQL a Internet**.

Il documento è in **due livelli**. Il Livello 1 funziona e basta; il Livello 2 è un miglioramento, non un requisito.

| | **Livello 1** | **Livello 2** |
|---|---|---|
| Da imparare | 2 concetti (tunnel SSH, utente del DB) | 4 concetti (aggiunge `socat` e `docker-compose`) |
| Tempo la prima volta | ~20 min | +20 min |
| Sicurezza | **identica** | **identica** |
| Se Coolify ricrea il database | devi aggiornare un indirizzo | non devi fare nulla |
| Con più progetti | un comando per database | un comando per tutti |
| Quando farlo | **adesso** | quando il Livello 1 ti dà fastidio |

> **Nota importante:** il Livello 2 **non cambia niente nel tuo client**. La porta locale resta `5440`, il profilo DBeaver resta lo stesso. Si passa da 1 a 2 senza rifare nulla.

---

## 1. I concetti, in cinque minuti

### Il problema

Il database vive in una **stanza senza porta sulla strada**: è nella rete privata della VPS e da Internet non ci si arriva. È esattamente ciò che vuoi. Ma è anche il motivo per cui DBeaver, dal tuo PC, non lo vede.

Oggi usi `docker exec ... psql`: ti teletrasporti **dentro** la stanza e lavori lì. Funziona, ma è scomodo.

### Il tunnel SSH

SSH è quello che usi già per entrare sulla VPS. Il "tunnel" è un uso diverso della **stessa** connessione: invece di aprire un terminale, SSH prende i dati che il tuo PC manda a una porta locale e li consegna a una porta della VPS.

Immagina un corriere di fiducia che hai già in casa. Normalmente lo mandi a fare commissioni sulla VPS; col tunnel gli dici: "prendi quello che scrivo sulla mia scrivania `127.0.0.1:5440` e portalo alla porta `5432` del database". DBeaver scrive sulla tua scrivania, il corriere trasporta, il database risponde.

- il corriere parte **solo con la tua chiave**;
- il viaggio è **cifrato**;
- **nessuna porta nuova** viene aperta su Internet.

### `socat` (solo Livello 2)

È un **centralinista** dentro la VPS. I container hanno un indirizzo interno che **cambia** quando Coolify li ricrea. Il centralinista dice: "chiama sempre il numero `5440`, ti passo io il database, qualunque indirizzo abbia oggi".

Senza: funziona, ma quando l'indirizzo cambia aggiorni il comando.
Con: l'indirizzo non lo guardi più.

### `docker-compose` (solo Livello 2)

Un file di testo con la lista dei container da avviare. **Non è codice del CMS** e non tocca l'applicazione: serve solo a far partire il centralinista e a farlo ripartire dopo un riavvio della VPS.

### Il ruolo del database (tutti e due i livelli)

Un **account ospite** per il database: legge e modifica le righe, ma non può cancellare tabelle o database. Se un giorno clicchi "elimina" sulla cosa sbagliata, il danno resta piccolo.

---

## 2. Livello 1 — Solo tunnel (parti da qui)

### 2.1 Crea l'utente del database

Sulla VPS, genera una password e salvala nel password manager:

```bash
openssl rand -base64 32
```

Entra nel database (sostituisci `<DB_CONTAINER>` con il nome che trovi con `docker ps | grep -i postgres`):

```bash
docker exec -it <DB_CONTAINER> psql -U postgres -d pictures_writers
```

```sql
CREATE ROLE gui_rw LOGIN PASSWORD '<PASSWORD>' CONNECTION LIMIT 5;

-- Una query lasciata aperta non deve bloccare migrazioni e deploy
ALTER ROLE gui_rw SET statement_timeout = '30s';
ALTER ROLE gui_rw SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE gui_rw SET lock_timeout = '5s';

GRANT CONNECT ON DATABASE pictures_writers TO gui_rw;
GRANT USAGE ON SCHEMA public TO gui_rw;

-- Chiude il database a chi non ha un grant esplicito
REVOKE CONNECT ON DATABASE pictures_writers FROM PUBLIC;

-- Tabelle e sequenze esistenti
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO gui_rw;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO gui_rw;

-- Tabelle che Prisma creerà in futuro (le crea il ruolo `postgres`)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gui_rw;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO gui_rw;
```

Cosa significa, in breve:

- `gui_rw` può leggere e scrivere righe; **non** può `CREATE`, `DROP`, `TRUNCATE`;
- `statement_timeout` evita che una query lasciata aperta blocchi un deploy;
- `CONNECTION LIMIT 5` evita che la GUI esaurisca le connessioni dell'app;
- `FOR ROLE postgres` serve perché le tabelle future le crea Prisma, non `gui_rw`: se le migrazioni girano con un altro utente, sostituiscilo.

> Se un giorno condividi un solo PostgreSQL tra più progetti, ricorda che i **ruoli sono cluster-wide** (valgono per tutti i database di quel container), non per database. Con un container per progetto — come in Coolify — non c'è interferenza.

### 2.2 Trova l'indirizzo interno del database

```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' <DB_CONTAINER>
```

Esce qualcosa come `172.18.0.5` (a volte due indirizzi: usa quello della rete che vedi anche nell'URL interno di Coolify).

Annotalo: è l'unico dato che cambierà nel tempo.

### 2.3 Apri il tunnel

Dal tuo PC, in PowerShell:

```powershell
ssh -i "$env:USERPROFILE\.ssh\pictures-writers" -N -L 5440:<IP_CONTAINER>:5432 deploy@<VPS_IP>
```

- `-N` = non aprire un terminale, fai solo da ponte;
- `-L 5440:<IP_CONTAINER>:5432` = "la mia porta 5440 corrisponde alla porta 5432 di quell'indirizzo";
- la finestra resta aperta e "muta": è normale. **Lasciala aperta** finché lavori.

> Se la chiave non è autorizzata per `deploy`, usa l'utente con cui entri abitualmente (spesso `root`): il tunnel funziona identicamente. Meglio comunque autorizzare `deploy`, che non è amministratore del sistema.

Verifica, in un **secondo** terminale:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 5440
# atteso: TcpTestSucceeded : True
```

> La porta `5440` è scelta apposta: la `5433` sul tuo PC è già occupata dal database di test del repo (`docker-compose.yml`).

### 2.4 Collega DBeaver

Installa **DBeaver Community** (gratuito) e crea una connessione PostgreSQL:

| Campo | Valore |
|---|---|
| Host | `127.0.0.1` |
| Port | `5440` |
| Database | `pictures_writers` |
| Username | `gui_rw` |
| Password | quella del §2.1 (salvata nel keychain di DBeaver) |
| SSL | **disattivato** (il traffico è già cifrato da SSH) |

Clicca *Test Connection*: se passa, sei operativo. Vedi le tabelle, apri i dati, modifichi le righe.

Suggerimenti per non farti male:

- attiva **Auto-commit** e disattiva *Smart commit*: niente transazioni lasciate aperte;
- imposta un limite di righe nel data editor (es. 200): un `SELECT *` su una tabella grande è il modo più rapido per rallentare la produzione;
- rinomina la connessione `PW · prod`, così con più progetti non sbagli bersaglio.

### 2.4bis Far gestire il tunnel a DBeaver (consigliato)

DBeaver sa aprire lui il tunnel SSH: sparisce la finestra PowerShell e il tunnel si chiude da solo quando ti disconnetti. È lo stesso tunnel, con la stessa chiave e la stessa cifratura.

In **Modifica connessione** → scheda **SSH**:

| Campo | Valore |
|---|---|
| Usa tunnel SSH | ✔ |
| Host/IP | `<VPS_IP>` |
| Porta | `22` |
| Utente | `deploy` (o `root`, se la chiave è autorizzata solo lì) |
| Autenticazione | chiave pubblica |
| Chiave privata | `C:\Users\<TUO_UTENTE>\.ssh\pictures-writers` |

E nella scheda **Principale** cambiano due campi:

| Campo | Valore |
|---|---|
| Host | `<IP_CONTAINER>` (es. `10.0.1.7`) |
| Porta | `5432` |

Database, utente e password restano quelli di `gui_rw`. Poi *Test Connection*.

> **Usa una chiave dedicata al tunnel**, diversa da quella con cui amministri la VPS (`root`). Una chiave autorizzata per entrambi gli utenti è lo stesso lasciapassare che apre due porte: se viene copiata, apre anche root. Con due chiavi separate, quella salvata in DBeaver vale solo per `deploy`, e la chiave di root resta intatta come accesso di emergenza.

Due cose da non dimenticare:

- **passphrase**: se la salvi, vive nella cassaforte locale di DBeaver protetta dalla *master password*; mettila nel password manager;
- **impronta del server**: alla prima connessione DBeaver chiede di accettare l'host key. Confrontala con `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` sulla VPS, come al §2.3.

Il punto fragile resta `<IP_CONTAINER>`: se Coolify ricrea il database, va aggiornato anche qui.

### 2.5 Uso quotidiano

**Con il tunnel gestito da DBeaver (§2.4bis):** apri DBeaver → doppio clic su `PW · prod`. Fine.

**Con il tunnel manuale (§2.3):**

1. Apri PowerShell e incolla il comando (puoi salvarlo in un file `.ps1`).
2. Lascia la finestra aperta.
3. Apri DBeaver.
4. Alla fine: `Ctrl+C` nella finestra, oppure chiudila.

### 2.6 Quando smette di funzionare

Sintomo: DBeaver dice `Connection refused` o va in timeout, ma la VPS risponde.

Causa quasi certa: **Coolify ha ricreato il container del database e l'IP è cambiato**. Capita con aggiornamenti e redeploy del database, non con quelli dell'app.

Rimedio, due minuti:

1. ripeti il comando del §2.2 per leggere il nuovo IP;
2. richiudi il tunnel e riaprilo con l'IP nuovo;
3. DBeaver: *Test Connection*.

Se ti capita spesso, è il momento del Livello 2.

---

## 3. Livello 2 — Centralinista (quando serve stabilità o più database)

Qui si aggiungono `socat` e un file `docker-compose.yml`. Non cambia niente lato client: **lo stesso profilo DBeaver, la stessa porta 5440**.

### 3.1 Trova container e rete

```bash
docker ps --format '{{.Names}}\t{{.Image}}' | grep -i postgres
```

```bash
docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' <DB_CONTAINER>
```

### 3.2 Crea il centralinista

```bash
sudo mkdir -p /opt/pw-db-gateway
sudo nano /opt/pw-db-gateway/docker-compose.yml
```

```yaml
name: pw-db-gateway

services:
  prod:
    image: alpine/socat:latest
    container_name: pw-db-gw-prod
    restart: unless-stopped
    networks: [coolify]
    ports:
      - "127.0.0.1:5440:5432"        # SOLO loopback: mai "5440:5432"
    command: ["tcp-listen:5432,fork,reuseaddr", "tcp-connect:postgres-abc123:5432"]

networks:
  coolify:
    external: true
    name: <NOME_RETE_COOLIFY>
```

Le tre cose che contano:

- `127.0.0.1:5440:5432` → ascolta **solo** in loopback. Se scrivi `5440:5432`, Docker pubblica su tutte le interfacce e **aggira UFW**: il database finisce su Internet. Non farlo mai.
- `tcp-connect` usa il **nome** del container, non l'IP: quando Coolify lo ricrea, il nome resta.
- `restart: unless-stopped` → riparte da solo dopo un reboot.

```bash
cd /opt/pw-db-gateway
sudo docker compose up -d
sudo docker compose ps
```

Verifica che ascolti solo in locale:

```bash
sudo ss -tlnp | grep 5440
# atteso: 127.0.0.1:5440   (NON 0.0.0.0:5440)
```

### 3.3 Configura il tunnel una volta sola

Da qui in poi non scrivi più l'IP: la destinazione è sempre `127.0.0.1:5440` della VPS, che è il centralinista.

Sulla VPS, limita cosa può inoltrare l'utente `deploy` (anche con la chiave rubata, la VPS non diventa un ponte verso la rete interna):

```bash
sudo nano /etc/ssh/sshd_config.d/10-db-tunnel.conf
```

```
Match User deploy
    AllowTcpForwarding local
    PermitOpen 127.0.0.1:*
    PermitListen none
```

```bash
sudo sshd -t && sudo systemctl reload ssh
```

> Se la tua versione di OpenSSH non conosce `PermitListen`, ometti quella riga. **Non chiudere** la sessione SSH corrente prima di averne aperta e verificata una nuova.

Sul tuo PC, in `C:\Users\<TUO_UTENTE>\.ssh\config`:

```
Host db-tunnel
    HostName <VPS_IP>
    User deploy
    IdentityFile ~/.ssh/pictures-writers
    IdentitiesOnly yes
    ServerAliveInterval 30
    ExitOnForwardFailure yes
    LocalForward 5440 127.0.0.1:5440
```

Poi, ogni giorno:

```powershell
ssh -N db-tunnel
```

`ExitOnForwardFailure yes` è importante: se la porta locale è occupata, la connessione **fallisce** invece di restare su senza tunnel (l'errore silenzioso più comune).

### 3.4 Più database (N istanze)

Convenzione, così non devi ricordare nulla:

| Elemento | Schema | Esempio |
|---|---|---|
| Container gateway | `pw-db-gw-<slug>` | `pw-db-gw-cliente-b` |
| Porta locale | `5440 + indice` | `5441` |
| Ruolo DB | `gui_rw` (uno per container) | `gui_rw` |
| Database | `pictures_writers_<slug>` | `pictures_writers_cliente_b` |
| Profilo client | `PW · <slug>` | `PW · cliente-b` |

Procedura, cinque passi:

1. **Coolify**: crea il nuovo PostgreSQL nel progetto dell'istanza; annota container e rete.
2. **Gateway**: aggiungi un servizio al compose con la nuova porta e il nuovo `tcp-connect`; se la rete è diversa, dichiarala sotto `networks:` e aggiungila al servizio. Poi `sudo docker compose up -d`.
3. **Ruolo**: esegui il SQL del §2.1 nel nuovo database (cambia solo il nome in `GRANT CONNECT`).
4. **Tunnel**: aggiungi `LocalForward 5441 127.0.0.1:5441` in `~/.ssh/config`.
5. **Client**: duplica il profilo DBeaver, cambia porta e nome.

Da quel momento `ssh -N db-tunnel` apre **tutti** i database insieme.

Revoca di un progetto che esce (nel container di quel progetto):

```sql
ALTER ROLE gui_rw NOLOGIN;   -- revoca immediata
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = 'gui_rw';
DROP OWNED BY gui_rw;        -- rimuove i GRANT: gui_rw non possiede oggetti
DROP ROLE gui_rw;
```

---

## 4. Prisma Studio (opzionale, già nel repo)

Con il tunnel aperto, dal repository:

```powershell
$env:DATABASE_URL="postgresql://gui_rw:<PASSWORD>@127.0.0.1:5440/pictures_writers?schema=public"
npx prisma studio
```

Editor con le relazioni già mappate dallo schema, molto vicino all'esperienza Neon.

- deve girare **sul tuo PC**, mai deployato: non ha autenticazione;
- le variabili d'ambiente della sessione hanno la precedenza sul `.env` (Prisma segue il comportamento di `dotenv`), ma se il `.env` locale contiene già `DATABASE_URL` controlla che i dati mostrati siano quelli di produzione;
- ottimo per modifiche puntuali, non per operazioni massive.

---

## 5. Cosa NON fare

- **Non** pubblicare `5432` "solo per un test". Docker pubblica con regole iptables che **scavalcano UFW**: il database sarebbe su Internet anche con il firewall che dice no.
- **Non** usare `postgres` nella GUI: un `DROP TABLE` distratto non chiede conferma.
- **Non** cambiare lo schema a mano. Le migrazioni Prisma sono l'unica fonte di verità; una colonna aggiunta a mano rompe `prisma migrate status` e il prossimo deploy.
- **Non** lavorare senza `statement_timeout`: una query aperta in `pg_stat_activity` può bloccare una migrazione e quindi un deploy.
- **Non** salvare password in script o file committati: keychain del client + password manager.
- **Non** condividere il tunnel: ognuno ha la sua chiave SSH e il suo ruolo.

### Il limite che nessuna GUI risolve

Modificare righe direttamente nel database **salta la logica applicativa**:

- **Cache ISR**: il sito mostra la versione vecchia finché non scatta un `revalidatePath` o il backstop delle 24h. Dopo un edit a mano serve il pulsante admin "Build website" (vedi `08-operations-runbook.md` §7.10).
- **Email e contatti**: la mailbox usa un'identità email canonica normalizzata; un edit che bypassa i write path può creare duplicati o contatti orfani.
- **Slug, URL, media**: nessun ricalcolo automatico di redirect o rendition.

Quindi: la GUI serve per **ispezionare, correggere, sbloccare**. Per i contenuti normali usa l'admin; per lo schema usa le migrazioni.

---

## 6. Verifica

Livello 1:

- [ ] `Test-NetConnection 127.0.0.1 5440` risponde `True` con il tunnel aperto.
- [ ] DBeaver si connette con `gui_rw`.
- [ ] `nmap -p 5432 <VPS_IP>` da fuori non risponde (o risponde `filtered`).
- [ ] `CREATE TABLE _prova (id int);` fallisce con `permission denied` (prova dal client).
- [ ] `DROP TABLE "Post";` fallisce.
- [ ] `SELECT count(*) FROM "Post";` funziona.
- [ ] Password di `gui_rw` nel password manager.
- [ ] Backup automatico attivo e **restore testato** (`03-coolify-postgres.md` §4).

Livello 2, in più:

- [ ] `sudo ss -tlnp | grep 5440` mostra **solo** `127.0.0.1`, mai `0.0.0.0`.
- [ ] `ssh -N db-tunnel` funziona e `ExitOnForwardFailure` blocca i conflitti di porta.
- [ ] Il gateway riparte dopo un reboot (`docker compose ps` dopo un riavvio in finestra tranquilla).

---

## 7. Troubleshooting

| Sintomo | Causa probabile | Rimedio |
|---|---|---|
| DBeaver: `Connection refused` su `127.0.0.1:5440` | tunnel chiuso o terminato | riapri il tunnel; controlla che la finestra sia viva |
| Funzionava, poi `Connection refused` dopo un deploy | container DB ricreato: IP cambiato | §2.6 (Livello 1) o passa al Livello 2 |
| `bind: Address already in use` | porta locale occupata (spesso il DB di test su 5433) | cambia porta in `-L`/`LocalForward` e nel profilo client |
| `connection timed out` dopo pochi minuti | NAT/idle timeout | Livello 2: `ServerAliveInterval 30`; Livello 1: riapri il tunnel |
| `FATAL: permission denied for table` | tabella creata dopo il `GRANT`, o `FOR ROLE` sbagliato | riesegui `ALTER DEFAULT PRIVILEGES` e i `GRANT` |
| `FATAL: no pg_hba.conf entry for host` | il `pg_hba.conf` non accetta la rete del client/gateway | usa la rete Docker giusta, o aggiungi la subnet al `pg_hba.conf` |
| `too many connections` | troppe schede, o `CONNECTION LIMIT` raggiunto | chiudi connessioni; alza il limite solo se serve |
| Query appesa e sito lento | transazione aperta nella GUI | `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename='gui_rw';` |
| `forwarding failed` all'avvio di SSH | `PermitOpen` non include la porta, o `AllowTcpForwarding no` | correggi `10-db-tunnel.conf`, `sshd -t`, reload |

---

## 8. Quando serve di più

| Esigenza | Soluzione | Costo/rischio |
|---|---|---|
| Più persone, più dispositivi | **Tailscale** su VPS e laptop; il gateway ascolta sull'IP tailnet, con ACL per utente | basso, dipendenza esterna |
| UI web senza tunnel | **DbGate** o **Adminer** in Coolify, dietro **Cloudflare Access**, utente `gui_ro`/`gui_rw` | medio: pannello admin esposto |
| Audit delle modifiche | `pgaudit` o trigger di audit sulle tabelle critiche | medio: va progettato |
| Molti database | gateway con N servizi (Livello 2, §3.4) | basso |

**Regola di crescita:** finché sei tu, tunnel. Quando diventate tre persone, Tailscale. Solo se serve il browser senza installare nulla, web UI + Access.

---

## 9. Riepilogo

- **Livello 1:** un tunnel SSH (manuale con `ssh -N -L`, oppure gestito direttamente da DBeaver) + un utente del database con poteri limitati + DBeaver. Venti minuti, sicurezza piena, un indirizzo da aggiornare ogni tanto.
- **Livello 2:** aggiungi un centralinista (`socat`) e metti il tunnel in `~/.ssh/config`. Il client non cambia; l'indirizzo non cambia più; i database multipli si aprono insieme.
