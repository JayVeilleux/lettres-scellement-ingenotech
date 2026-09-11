// Service worker minimal : rend l'app installable et met en cache la coquille
// de l'app (index.html, manifest, icones, jszip) pour un fonctionnement hors
// ligne une fois chargee une premiere fois. Toujours "reseau d'abord" pour la
// coquille elle-meme : on va chercher la derniere version en ligne quand il y
// a une connexion, et on ne se rabat sur la copie locale que hors ligne, pour
// ne jamais rester bloque sur une version perimee apres une mise a jour.

var CACHE = 'lettres-scellement-shell-v2';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './jszip.min.js', './html2canvas.min.js', './jspdf.umd.min.js'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  var isShell = url.origin === location.origin;

  if (e.request.method !== 'GET' || !isShell) {
    return;
  }

  e.respondWith(
    fetch(e.request).then(function (res) {
      caches.open(CACHE).then(function (c) { c.put(e.request, res.clone()); });
      return res;
    }).catch(function () { return caches.match(e.request); })
  );
});
