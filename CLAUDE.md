# CLAUDE.md

Questo file fornisce indicazioni a Claude Code (claude.ai/code) per lavorare con il codice di questo repository.

## Panoramica del Progetto

Due componenti per l'invio massivo di messaggi WhatsApp:

1. **`whatsapp_bulk_sender.html`** — Web app manuale (single-page, client-side puro) per generare link WhatsApp uno alla volta.
2. **`sender/`** — Script Node.js con Playwright che automatizza l'intero flusso: apre WhatsApp Web, invia i messaggi e passa al numero successivo.

## Come Funziona

1. L'utente inserisce numeri di telefono italiani (uno per riga, senza il prefisso +39) e un messaggio.
2. Cliccando "Inizia Configurazione" vengono validati gli input e il messaggio viene codificato per URL.
3. Ogni click su "Invia al Prossimo Numero" apre una nuova scheda del browser verso `api.whatsapp.com/send` con il messaggio precompilato per il numero successivo nella lista.
4. Un contatore tiene traccia dei messaggi inviati e di quelli rimanenti.

## Sviluppo

- **Web app manuale**: aprire `whatsapp_bulk_sender.html` direttamente nel browser — non serve un server.
- **Script automatico**: configurare `sender/config.json` con numeri e messaggio, poi:
  ```bash
  cd sender
  npm install
  node send.js
  ```
  Alla prima esecuzione, scansionare il QR code di WhatsApp Web. Le sessioni successive riutilizzano il profilo salvato in `sender/whatsapp-profile/`.

## Note sull'Architettura

- I numeri di telefono sono prefissati con il codice paese italiano `39` (configurabile in `config.json`).
- Usa `encodeURIComponent` per una codifica URL compatibile con le emoji.
- La web app HTML mantiene lo stato in variabili JS globali — non c'è persistenza.
- Lo script Playwright usa `web.whatsapp.com/send?phone=...&text=...` per aprire direttamente la chat con il messaggio precompilato, evitando il redirect di `wa.me`.
- Il selettore per il campo messaggio è `div[contenteditable="true"][data-tab="10"]` — può cambiare con aggiornamenti di WhatsApp Web.

## Note

Questo progetto è stato sviluppato con l'assistenza di Claude Code (claude.ai/code).