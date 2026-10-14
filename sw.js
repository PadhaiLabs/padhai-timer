/* Lets Padhai Timer open without internet after the first visit.
   When you change any file, raise the number in CACHE so phones pick up the new version. */
const CACHE = "padhai-v30";
const SHELL = ["./", "index.html", "style.css", "clock.js", "i18n.js", "app.js", "firebase-config.js", "manifest.json",
               "privacy.html", "terms.html", "install.html", "home/", "home/index.html", "home/home.css", "home/home.js", "home/i18n.js", "home/how.html", "home/why.html", "home/stories.html", "home/contact.html", "home/community.html", "home/filter.js", "community.js", "install-sheet.js", "qr.js", "guide.js", "community-text.js", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;  // Firebase and fonts go straight to the network
  e.respondWith(
    fetch(e.request, {cache: "no-cache"}).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("index.html")))
  );
});
