/* Spese 3.0 — service worker: tiene l'app disponibile anche senza rete.
   Le chiamate al ponte non si memorizzano mai: devono sempre andare in rete. */
const CACHE = "spese3-v1";
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
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
