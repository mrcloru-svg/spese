/* Spese 3.0 — service worker: tiene l'app disponibile anche senza rete.

   Strategia:
   - la pagina (index.html) si prende PRIMA dalla rete, e si ricade sulla copia
     salvata solo se la rete non risponde. Così un aggiornamento pubblicato su
     GitHub arriva al primo avvio utile, senza svuotare niente a mano;
   - icone e manifest si prendono prima dalla cache: non cambiano quasi mai;
   - le chiamate al ponte non si memorizzano mai: devono sempre andare in rete.

   Il numero di versione va aumentato a ogni modifica di questo file: al cambio
   di nome la cache vecchia viene buttata e ricostruita. */
const CACHE = "spese3-v2";
const FILE = ["./", "./index.html", "./manifest.json", "./icona-192.png", "./icona-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k =>
    Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.hostname.indexOf("google") !== -1) return;         // ponte: sempre dalla rete
  if (e.request.method !== "GET") return;

  const ePagina = e.request.mode === "navigate" ||
                  url.pathname.endsWith("/") ||
                  url.pathname.endsWith("index.html");

  if (ePagina) {
    // prima la rete: così le versioni nuove arrivano da sole
    e.respondWith(
      fetch(e.request).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copia)).catch(()=>{});
        return res;
      }).catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // il resto: prima la cache, è roba che non cambia
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
