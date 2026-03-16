const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let currentProcess = null;
let logBuffer = [];
let sseClients = new Set();

function broadcast(line, event) {
  const data = event
    ? `event: ${event}\ndata: ${line}\n\n`
    : `data: ${line}\n\n`;
  for (const client of sseClients) {
    client.write(data);
  }
}

// SSE endpoint per i log in tempo reale
app.get("/api/logs", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Invia i log già accumulati
  for (const line of logBuffer) {
    res.write(`data: ${line}\n\n`);
  }

  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
});

// Avvia l'invio
app.post("/api/send", (req, res) => {
  if (currentProcess) {
    return res.status(409).json({ error: "Invio già in corso" });
  }

  const { numeri, messaggio, prefisso, delayMinSec, delayMaxSec } = req.body;

  if (!numeri || numeri.length === 0) {
    return res.status(400).json({ error: "Inserisci almeno un numero" });
  }
  if (!messaggio) {
    return res.status(400).json({ error: "Inserisci un messaggio" });
  }

  // Scrivi config.json
  const config = {
    prefisso: prefisso || "39",
    numeri,
    messaggio,
    delayMinSec: delayMinSec || 5,
    delayMaxSec: delayMaxSec || 10,
  };
  fs.writeFileSync(
    path.join(__dirname, "config.json"),
    JSON.stringify(config, null, 2)
  );

  // Reset
  logBuffer = [];

  // Avvia send.js come processo figlio
  currentProcess = spawn("node", ["send.js"], {
    cwd: __dirname,
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  currentProcess.stdout.on("data", (data) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      logBuffer.push(line);
      broadcast(line);
    }
  });

  currentProcess.stderr.on("data", (data) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      logBuffer.push(`[ERRORE] ${line}`);
      broadcast(`[ERRORE] ${line}`);
    }
  });

  currentProcess.on("close", (code) => {
    const msg = code === 0 ? "Invio completato!" : `Processo terminato (codice: ${code})`;
    logBuffer.push(msg);
    broadcast(msg, "done");
    currentProcess = null;
  });

  res.json({ ok: true, message: "Invio avviato" });
});

// Stato corrente
app.get("/api/status", (req, res) => {
  res.json({ running: currentProcess !== null });
});

// Ferma l'invio
app.post("/api/stop", (req, res) => {
  if (!currentProcess) {
    return res.status(404).json({ error: "Nessun invio in corso" });
  }
  currentProcess.kill();
  currentProcess = null;
  broadcast("Invio interrotto dall'utente", "done");
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
