const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const config = require("./config.json");

function delay(minSec, maxSec) {
  const ms = (Math.random() * (maxSec - minSec) + minSec) * 1000;
  return new Promise((resolve) => setTimeout(resolve, Math.round(ms)));
}

function ts() {
  return new Date().toLocaleTimeString("it-IT");
}

const { prefisso, numeri, messaggio, delayMinSec, delayMaxSec } = config;

if (!numeri || numeri.length === 0) {
  console.error("Nessun numero in config.json");
  process.exit(1);
}

console.log(`[${ts()}] Avvio con ${numeri.length} numeri da contattare`);
console.log(`[${ts()}] Delay tra messaggi: ${delayMinSec}-${delayMaxSec}s\n`);

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./whatsapp-session" }),
  puppeteer: {
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-extensions",
      "--no-first-run",
    ],
  },
});

// Mostra QR code nel terminale (solo alla prima esecuzione)
client.on("qr", (qr) => {
  console.log(`[${ts()}] Scansiona il QR code qui sotto con WhatsApp:\n`);
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log(`[${ts()}] Autenticazione riuscita!`);
});

client.on("auth_failure", (msg) => {
  console.error(`[${ts()}] Autenticazione fallita: ${msg}`);
  process.exit(1);
});

client.on("ready", async () => {
  console.log(`[${ts()}] WhatsApp Web pronto! Inizio invio...\n`);

  let inviati = 0;
  let falliti = 0;

  for (let i = 0; i < numeri.length; i++) {
    const numero = numeri[i].replace(/\s+/g, "");
    const chatId = `${prefisso}${numero}@c.us`;

    console.log(`[${ts()}] (${i + 1}/${numeri.length}) Invio a ${numero}...`);

    try {
      // Ottieni l'ID corretto del numero da WhatsApp (risolve problemi di formato)
      const numberId = await client.getNumberId(`${prefisso}${numero}`);
      if (!numberId) {
        console.log(`[${ts()}] ⚠ ${numero} non è registrato su WhatsApp, salto.`);
        falliti++;
        continue;
      }

      const resolvedChatId = numberId._serialized;
      console.log(`[${ts()}]   Chat ID risolto: ${resolvedChatId}`);

      // Invia il messaggio (usa l'API interna, nessun ricaricamento pagina)
      const result = await client.sendMessage(resolvedChatId, messaggio);
      console.log(`[${ts()}]   Message ID: ${result.id.id}`);

      // Attende che il messaggio venga effettivamente inviato al server (ACK >= 1)
      const ack = await new Promise((resolve) => {
        if (result.ack >= 1) return resolve(result.ack);
        const timeout = setTimeout(() => resolve(result.ack), 15000);
        result.on("ack_changed", (newAck) => {
          console.log(`[${ts()}]   ACK aggiornato: ${newAck}`);
          if (newAck >= 1) {
            clearTimeout(timeout);
            resolve(newAck);
          }
        });
      });

      if (ack >= 1) {
        inviati++;
        console.log(`[${ts()}] ✓ Messaggio inviato a ${numero} (ACK: ${ack})`);
      } else {
        falliti++;
        console.log(`[${ts()}] ⚠ Messaggio a ${numero} ancora in coda (ACK: ${ack})`);
      }
    } catch (err) {
      falliti++;
      console.error(`[${ts()}] ✗ Errore per ${numero}: ${err.message}`);
    }

    // Delay casuale prima del prossimo numero (tranne l'ultimo)
    if (i < numeri.length - 1) {
      const attesa = Math.round(
        Math.random() * (delayMaxSec - delayMinSec) + delayMinSec
      );
      console.log(`[${ts()}] Attesa ${attesa}s prima del prossimo...\n`);
      await delay(delayMinSec, delayMaxSec);
    }
  }

  console.log(`\n[${ts()}] === RIEPILOGO ===`);
  console.log(
    `Totale: ${numeri.length} | Inviati: ${inviati} | Falliti: ${falliti}`
  );

  // Attende 10s prima di chiudere per assicurarsi che tutti i messaggi siano consegnati
  console.log(`[${ts()}] Attesa 10s per completare la consegna...`);
  await delay(10, 10);

  await client.destroy();
  process.exit(0);
});

client.initialize();
