"use client";
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
