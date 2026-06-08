const CACHE = "cape-parts-v1";
const OFFLINE_URLS = ["/", "/admin", "/offline.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("supabase")) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("/offline.html")))
  );
});

self.addEventListener("push", e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || "Cape Parts Finder", {
      body: data.body || "You have a new notification",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "default",
      data: { url: data.url || "/admin" },
      actions: [{ action: "open", title: "View" }, { action: "dismiss", title: "Dismiss" }]
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  if (e.action === "dismiss") return;
  const url = e.notification.data?.url || "/admin";
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(cs => {
      const c = cs.find(c => c.url.includes(url));
      if (c) return c.focus();
      return clients.openWindow(url);
    })
  );
});
