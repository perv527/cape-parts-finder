"use client";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [status, setStatus] = useState<"online"|"offline"|"back"|null>(null);

  useEffect(() => {
    if (!navigator.onLine) setStatus("offline");

    function handleOffline() { setStatus("offline"); }
    function handleOnline() {
      setStatus("back");
      setTimeout(() => setStatus(null), 3000);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!status) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-center py-2 px-4 text-[13px] font-medium"
      style={{ background: status === "offline" ? "rgba(239,68,68,0.95)" : "rgba(34,197,94,0.95)" }}>
      {status === "offline" ? (
        <span className="text-white">No internet connection - changes may not save</span>
      ) : (
        <span className="text-white">Back online!</span>
      )}
    </div>
  );
}
