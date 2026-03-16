# WhatsApp Bulk Sender

Strumento per l'invio massivo di messaggi WhatsApp, con due modalità:

1. **Web App manuale** — pagina HTML che genera link WhatsApp uno alla volta
2. **Script automatico** — Node.js + whatsapp-web.js con interfaccia web per invio completamente automatizzato

## Requisiti

- [Node.js](https://nodejs.org) (versione LTS)

## Installazione

```bash
git clone https://github.com/AndreaValenziano/whatsapp_bulk_sender.git
cd whatsapp_bulk_sender/sender
npm install
cp config.example.json config.json
```

Modifica `config.json` con i tuoi numeri e messaggio.

## Utilizzo

### Interfaccia web (consigliato)

```bash
npm run web
```

Apri http://localhost:3000 — inserisci numeri e messaggio direttamente dal browser con log in tempo reale.

### Solo da terminale

```bash
npm start
```

### Web app manuale

Apri `whatsapp_bulk_sender.html` nel browser — non richiede installazione.

## Configurazione

Esempio `config.json`:

```json
{
  "prefisso": "39",
  "numeri": ["3471234567", "3489876543"],
  "messaggio": "Ciao! *Questo è un messaggio di test* 😊",
  "delayMinSec": 5,
  "delayMaxSec": 10
}
```

| Campo | Descrizione |
|-------|-------------|
| `prefisso` | Prefisso internazionale (default: `39` Italia) |
| `numeri` | Lista numeri senza prefisso |
| `messaggio` | Testo con formattazione WhatsApp (`*grassetto*`, `_corsivo_`, `~barrato~`) |
| `delayMinSec` / `delayMaxSec` | Intervallo delay casuale tra un messaggio e l'altro |

## Prima esecuzione

Alla prima esecuzione appare un QR code — scansionalo con WhatsApp dal telefono. Le sessioni successive riutilizzano l'autenticazione salvata.
