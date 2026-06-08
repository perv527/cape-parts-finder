import os

# 1. Create Error Boundary component
error_boundary = '''"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            We hit an unexpected error. Your data is safe — please try again or refresh the page.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={reset}
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Try Again
            </button>
            <button onClick={() => window.location.href = "/"}
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 24px", fontSize: 14, cursor: "pointer" }}>
              Go Home
            </button>
          </div>
          <p style={{ color: "#374151", fontSize: 12, marginTop: 20 }}>Cape Parts Finder</p>
        </div>
      </body>
    </html>
  );
}
'''
open("frontend/app/global-error.tsx", "w", encoding="utf-8").write(error_boundary)
print("Created global-error.tsx!")

# 2. Create offline detection component
offline_component = '''"use client";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    function handleOffline() { setOffline(true); setShow(true); }
    function handleOnline() { setOffline(false); setTimeout(() => setShow(false), 3000); }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (!navigator.onLine) { setOffline(true); setShow(true); }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-center py-2 px-4 text-[13px] font-medium transition-all"
      style={{ background: offline ? "rgba(239,68,68,0.9)" : "rgba(34,197,94,0.9)", backdropFilter: "blur(8px)" }}>
      {offline ? (
        <span className="text-white flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
          No internet connection — changes may not save
        </span>
      ) : (
        <span className="text-white flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Back online!
        </span>
      )}
    </div>
  );
}
'''
os.makedirs("frontend/components", exist_ok=True)
open("frontend/components/OfflineBanner.tsx", "w", encoding="utf-8").write(offline_component)
print("Created OfflineBanner.tsx!")

# 3. Update layout to include OfflineBanner
layout = open("frontend/app/layout.tsx", encoding="utf-8").read()
old_layout = 'import type { Metadata } from "next";\nimport "./globals.css";'
new_layout = '''import type { Metadata } from "next";
import "./globals.css";
import { OfflineBanner } from "@/components/OfflineBanner";'''
layout = layout.replace(old_layout, new_layout, 1)

old_body = '<body style={{overflowX:"hidden",maxWidth:"100vw"}}>{children}</body>'
new_body = '<body style={{overflowX:"hidden",maxWidth:"100vw"}}><OfflineBanner />{children}</body>'
layout = layout.replace(old_body, new_body, 1)

open("frontend/app/layout.tsx", "w", encoding="utf-8").write(layout)
print("Updated layout.tsx!")

print("\nAll done!")
print("has global-error:", os.path.exists("frontend/app/global-error.tsx"))
print("has OfflineBanner:", os.path.exists("frontend/components/OfflineBanner.tsx"))
print("layout has OfflineBanner:", "OfflineBanner" in layout)
