import os

os.makedirs("frontend/public", exist_ok=True)

# 1. Web App Manifest
manifest = '''{
  "name": "Cape Parts Finder",
  "short_name": "Parts Finder",
  "description": "Find car parts fast in Cape Town",
  "start_url": "/admin",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#f97316",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    { "name": "New Requests", "url": "/admin", "description": "View new requests" },
    { "name": "Add Sale", "url": "/sales", "description": "Record a sale" }
  ]
}'''
open("frontend/public/manifest.json", "w").write(manifest)
print("Created manifest.json")

# 2. Service Worker
sw = '''const CACHE = "cape-parts-v1";
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
'''
open("frontend/public/sw.js", "w").write(sw)
print("Created sw.js")

# 3. Offline fallback page
offline = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline - Cape Parts Finder</title>
<style>
  body { background: #0a0a0a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 24px; }
  .icon { width: 64px; height: 64px; background: rgba(249,115,22,0.15); border: 2px solid rgba(249,115,22,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; }
  h1 { font-size: 22px; margin-bottom: 8px; }
  p { color: #6b7280; font-size: 14px; line-height: 1.6; max-width: 300px; margin: 0 auto 24px; }
  button { background: linear-gradient(135deg,#f97316,#ea580c); color: white; border: none; border-radius: 12px; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>
</head>
<body>
  <div>
    <div class="icon">📡</div>
    <h1>No connection</h1>
    <p>Cape Parts Finder needs internet to load. Check your connection and try again.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>'''
open("frontend/public/offline.html", "w").write(offline)
print("Created offline.html")

# 4. Update layout.tsx to register SW and add manifest
layout = open("frontend/app/layout.tsx", encoding="utf-8").read()

old_meta = '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />'
new_meta = '''<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      <meta name="theme-color" content="#f97316" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Parts Finder" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon-192.png" />'''
layout = layout.replace(old_meta, new_meta, 1)

old_body = '<body style={{overflowX:"hidden",maxWidth:"100vw"}}>'
new_body = '''<body style={{overflowX:"hidden",maxWidth:"100vw"}}>
      <script dangerouslySetInnerHTML={{__html: `
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          });
        }
      `}} />'''
layout = layout.replace(old_body, new_body, 1)

open("frontend/app/layout.tsx", "w", encoding="utf-8").write(layout)
print("Updated layout.tsx!")

# 5. Create PWA install prompt component
pwa_component = '''"use client";
import { useEffect, useState } from "react";

export function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
      // Show after 30 seconds on admin pages
      setTimeout(() => setShow(true), 30000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShow(false);
  }

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-2xl p-4 flex items-start gap-3"
      style={{ background: "#1a1a1a", border: "1px solid rgba(249,115,22,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-white mb-0.5">Install Cape Parts Finder</p>
        <p className="text-[12px] text-gray-400 mb-3">Add to your home screen for instant access and notifications.</p>
        <div className="flex gap-2">
          <button onClick={install}
            className="flex-1 py-2 rounded-xl text-[12px] font-semibold cursor-pointer text-white"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", border: "none" }}>
            Install App
          </button>
          <button onClick={() => setShow(false)}
            className="px-3 py-2 rounded-xl text-[12px] cursor-pointer"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
'''
open("frontend/components/PWAInstallPrompt.tsx", "w", encoding="utf-8").write(pwa_component)
print("Created PWAInstallPrompt.tsx!")

# 6. Add PWA prompt to admin page
admin = open("frontend/app/admin/page.tsx", encoding="utf-8").read()
old_import = 'import { useRouter } from "next/navigation";'
new_import = '''import { useRouter } from "next/navigation";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";'''
admin = admin.replace(old_import, new_import, 1)

old_main_close = '\n    </main>\n  );\n}'
new_main_close = '''
      <PWAInstallPrompt />
    </main>
  );
}'''
admin = admin.replace(old_main_close, new_main_close, 1)
open("frontend/app/admin/page.tsx", "w", encoding="utf-8").write(admin)
print("Updated admin.tsx!")

print("\nAll PWA files created!")
