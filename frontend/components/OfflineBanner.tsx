"use client";
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
