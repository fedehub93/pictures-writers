# 02 — VPS Hetzner: creazione e hardening

Obiettivo: una VPS **CAX21** (ARM64, 4 vCPU, 8 GB RAM, 80 GB NVMe) con Ubuntu 24.04 LTS, accesso solo via chiave SSH, firewall, swap, Docker pronto per Coolify.

> Nota: il CAX21 è **ARM64** (`aarch64`). Tutto ciò che compili deve essere per ARM64. Coolify e le immagini Docker ufficiali (Node, PostgreSQL) supportano ARM64. Vedi `09-troubleshooting.md` se un binario nativo (sharp, Prisma) dà errori.

---

## 1. Scelta della posizione

Scegli la location più vicina ai tuoi utenti e a Neon (che oggi è probabilmente in EU, es. Francoforte):

- **Falkenstein (FSN1)** o **Norimberga (NBG1)**, Germania.
- **Helsinki (HEL1)**, Finlandia.

Tutte e tre hanno lo stesso prezzo. Per un sito italiano, FSN1/NBG1 sono una scelta ragionevole. La latenza verso Neon (se resta EU) sarà di pochi millisecondi.

---

## 2. Creazione del server (console Hetzner)

1. **Networking** → crea o riusa una **SSH key**. Se non ne hai una:

   ```powershell
   ssh-keygen -t ed25519 -C "pictures-writers-vps" -f "$env:USERPROFILE\.ssh\pictures-writers"
   Get-Content "$env:USERPROFILE\.ssh\pictures-writers.pub" | Set-Clipboard
   ```

   Incolla la chiave pubblica in Hetzner. Conserva la privata: non esce dal tuo PC.

2. **Firewalls** → crea un firewall cloud (vedi §5) e assegnalo al server. Il firewall Hetzner blocca il traffico **prima** che arrivi alla VM, quindi è più affidabile di UFW contro i port publish di Docker.

3. **Cloud Console** → **Add Server**:
   - Location: FSN1 / NBG1 / HEL1.
   - Image: **Ubuntu 24.04** (ARM64).
   - Type: **CAX21** (Shared vCPU, Ampere Altra).
   - Networking: **IPv4 pubblica** (€0,50/mese) + IPv6.
   - SSH keys: la tua.
   - **Backups**: attivali se accetti ~€1,20/mese (consigliato).
   - Volumes: nessuno (80 GB bastano; monitora).
   - Cloud-init: vuoto.
   - Name: `pictures-writers-prod`.

4. Annota **IPv4**, **IPv6** e hostname.

5. Primo accesso:

   ```powershell
   ssh -i "$env:USERPROFILE\.ssh\pictures-writers" root@<VPS_IP>
   ```

6. Verifica l'architettura:

   ```bash
   uname -m          # deve essere aarch64
   cat /etc/os-release
   nproc             # 4
   free -h           # ~8 GiB
   df -h /           # ~78 GiB disponibili
   ```

---

## 3. Aggiornamenti e pacchetti base

```bash
apt update
apt -y upgrade
apt -y install curl wget git ca-certificates jq unzip htop ncdu fail2ban ufw unattended-upgrades apt-listchanges
timedatectl set-timezone Europe/Rome
timedatectl
```

Se l'aggiornamento ha installato un nuovo kernel:

```bash
reboot
```

Riconnettiti e verifica.

### Aggiornamenti automatici di sicurezza

```bash
dpkg-reconfigure -plow unattended-upgrades
```

Rispondi **Yes**. Poi, per evitare riavvii automatici di un server con database:

```bash
cat > /etc/apt/apt.conf.d/51unattended-upgrades-local <<'EOF'
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF
```

Gli aggiornamenti di sicurezza vengono installati; i riavvii li decidi tu in una finestra di manutenzione.

---

## 4. SSH hardening

Mantieni **aperta** la sessione SSH corrente finché non hai verificato che la nuova configurazione funziona.

```bash
mkdir -p /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-pictures-writers.conf <<'EOF'
PermitRootLogin prohibit-password
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

sshd -t
systemctl reload ssh
```

Apri un **secondo terminale** e verifica:

```powershell
ssh -i "$env:USERPROFILE\.ssh\pictures-writers" root@<VPS_IP>
```

Se funziona, chiudi la vecchia sessione. Se non funziona, ripristina dal terminale ancora aperto:

```bash
rm /etc/ssh/sshd_config.d/99-pictures-writers.conf
systemctl reload ssh
```

### Opzione: utente non-root

Coolify funziona anche con un utente sudo-capable. Se preferisci:

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Poi usa `deploy` per Coolify. Per semplicità, questa guida assume root con **solo chiave** (niente password). Se usi `deploy`, sostituisci `root` nei comandi.

---

## 5. Firewall

### 5.1 Firewall Hetzner (consigliato, livello provider)

In **Hetzner Cloud → Firewalls → Create Firewall**, regole **inbound**:

| Protocollo | Porta | Sorgente | Scopo |
|---|---|---|---|
| TCP | 22 | **il tuo IP** (meglio) o `0.0.0.0/0` + fail2ban | SSH |
| TCP | 80 | `0.0.0.0/0`, `::/0` | HTTP / Let's Encrypt |
| TCP | 443 | `0.0.0.0/0`, `::/0` | HTTPS |
| TCP | 8000 | **solo il tuo IP** | Coolify dashboard (temporaneo) |
| TCP | 6001 | **solo il tuo IP** | Coolify realtime (temporaneo) |
| TCP | 6002 | **solo il tuo IP** | Coolify terminal (temporaneo) |
| ICMP | — | `0.0.0.0/0` | ping/diagnostica (opzionale) |

Outbound: **allow all**.

Dopo aver configurato il dominio della dashboard Coolify (HTTPS su 443), **rimuovi** le regole 8000/6001/6002.

> Non aprire mai `5432` verso Internet. PostgreSQL deve restare sulla rete Docker interna.

### 5.2 UFW (difesa in profondità)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
# temporaneo, sostituisci con il TUO IP
ufw allow from <TUO_IP> to any port 8000 proto tcp
ufw allow from <TUO_IP> to any port 6001 proto tcp
ufw allow from <TUO_IP> to any port 6002 proto tcp
ufw --force enable
ufw status verbose
```

**Attenzione:** Docker può pubblicare porte bypassando UFW. Per questo il firewall Hetzner è la difesa principale. Non pubblicare porte host per Postgres o per l'app: Coolify usa Traefik sulla rete Docker.

### 5.3 fail2ban

```bash
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
EOF

systemctl enable --now fail2ban
fail2ban-client status sshd
```

Se usi una porta SSH diversa da 22, cambia `port` di conseguenza.

---

## 6. Swap (raccomandato sul CAX21)

Con 8 GB di RAM il server respira, ma Coolify + Postgres + un build Next.js possono comunque saturarla. Aggiungi 4 GB di swap su NVMe come rete di sicurezza:

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

cat > /etc/sysctl.d/99-pictures-writers.conf <<'EOF'
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF
sysctl --system
free -h
swapon --show
```

Lo swap non sostituisce la RAM: se il sistema swappa in continuazione durante i build, è il momento di passare a CAX31 o di costruire altrove.

---

## 7. Installazione di Coolify

Coolify installa Docker, Traefik e i propri container. Fallo **dopo** l'hardening e **prima** di configurare il daemon Docker.

### 7.1 Installazione con admin pre-creato (consigliato)

Evita che la pagina di registrazione resti aperta:

```bash
sudo -E env \
  ROOT_USERNAME='admin' \
  ROOT_USER_EMAIL='<TUA_EMAIL>' \
  ROOT_USER_PASSWORD='<PASSWORD_FORTE>' \
  bash -c 'curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash'
```

Requisiti password: almeno 8 caratteri, maiuscola, minuscola, numero, simbolo.

Al termine, il terminale stampa l'URL della dashboard:

```
http://<VPS_IP>:8000
```

Apri la dashboard **subito**, accedi e:

1. Attiva **2FA** (Two-Factor Authentication) nelle impostazioni utente.
2. Verifica che la registrazione pubblica sia chiusa.
3. Annota la versione di Coolify installata.

> **Backup immediato dei segreti di installazione:**
> ```bash
> cat /data/coolify/source/.env
> ```
> Copia questo file nel tuo password manager. Contiene `APP_KEY`, la chiave con cui Coolify cifra le variabili d'ambiente dei progetti. **Senza questo file non puoi ripristinare Coolify.** Non condividerlo e non committarlo.

### 7.2 Dominio della dashboard

Crea un record DNS:

```
coolify.<DOMAIN>   A   <VPS_IP>
```

In Coolify: **Settings → Instance → Instance Settings** (o **Settings → Configuration**) → imposta `https://coolify.<DOMAIN>`, salva. Traefik richiede il certificato Let's Encrypt (porte 80/443 aperte). Attendi che il certificato sia emesso, poi verifica:

```bash
curl -I https://coolify.<DOMAIN>
```

A questo punto puoi **chiudere** le porte 8000/6001/6002 nel firewall Hetzner e in UFW:

```bash
ufw delete allow from <TUO_IP> to any port 8000 proto tcp
ufw delete allow from <TUO_IP> to any port 6001 proto tcp
ufw delete allow from <TUO_IP> to any port 6002 proto tcp
```

La dashboard passerà da `https://coolify.<DOMAIN>` su 443.

### 7.3 Impostazioni consigliate

- **Settings → Advanced**: lascia la **DNS validation** attiva. Se usi Cloudflare con proxy arancione, Coolify riconosce gli IP Cloudflare.
- **Auto-update**: **disattivato**. Aggiorna Coolify manualmente, dopo aver letto le release notes, in una finestra di manutenzione. Un aggiornamento automatico rotto può rendere la dashboard irraggiungibile.
- **Notifications**: configura almeno una destinazione (email, Telegram, Discord, Slack). Abilita:
  - Deployment failed
  - Backup failed
  - Disk usage high
  - Server unreachable
- **Team**: crea un solo utente admin. Non invitare persone non necessarie.

---

## 8. Docker: log rotation e manutenzione

Dopo l'installazione di Coolify, Docker è presente. Configura la rotazione dei log **prima** di deployare applicazioni (un restart di Docker riavvia i container):

```bash
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
docker info --format '{{.LoggingDriver}}'
```

Verifica che i container Coolify siano ripartiti:

```bash
docker ps
```

Se qualcosa non riparte, riavvia Coolify:

```bash
cd /data/coolify/source && docker compose up -d
```

### Pulizia automatica

In Coolify: **Servers → localhost → Docker Cleanup**:

- Frequenza: `0 0 * * *` (ogni giorno a mezzanotte).
- Trigger: **Only above disk threshold**, soglia **80%**.
- **Non** abilitare la cancellazione dei volumi inutilizzati: potrebbero contenere dati.
- Mantieni le immagini per il rollback (es. 2–3).

Esegui una pulizia manuale e controlla il risultato.

---

## 9. Verifiche finali del server

```bash
# Architettura e risorse
uname -m
free -h
df -h /
nproc

# Swap attivo
swapon --show

# Firewall
ufw status verbose

# fail2ban
fail2ban-client status sshd

# Docker
docker ps
docker system df

# Coolify
curl -I https://coolify.<DOMAIN>

# Porte in ascolto
ss -tulpn | grep -E ':(22|80|443|8000|6001|6002)\b'
```

Crea uno **snapshot Hetzner** chiamato `baseline-coolify-hardened` prima di procedere. Costa pochi centesimi e ti permette di tornare a questo stato in caso di errore.

---

## 10. Cosa NON fare sul server

- Non installare un secondo reverse proxy (Nginx/Apache): Traefik di Coolify occupa 80/443.
- Non installare PostgreSQL a mano fuori da Coolify: perderesti backup e gestione.
- Non usare `docker run` per l'app: usa Coolify, così hai deploy, log, rollback e TLS.
- Non esporre la dashboard su HTTP pubblico.
- Non disabilitare il firewall per "fare una prova".
- Non usare `ufw` come unica difesa: Docker pubblica porte direttamente.
- Non fare `docker system prune -a --volumes` senza sapere cosa stai cancellando.
- Non mettere la swap su un disco che si riempie: monitora `df -h`.
