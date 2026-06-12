"use client";
import { useEffect, useState } from "react";

export function UndoToast({ onUndo, onDismiss }: { onUndo: () => void; onDismiss: () => void }) {
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    if (seconds <= 0) { onDismiss(); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onDismiss]);

  return (
    <div style={{
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px", padding: "12px 20px", display: "flex",
      alignItems: "center", gap: "16px", zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      <span style={{ color: "#d1d5db", fontSize: "14px" }}>Bulk update applied</span>
      <button onClick={onUndo} style={{
        background: "#f97316", color: "white", border: "none",
        borderRadius: "8px", padding: "6px 14px", fontWeight: "bold",
        fontSize: "13px", cursor: "pointer"
      }}>Undo ({seconds}s)</button>
      <button onClick={onDismiss} style={{
        background: "transparent", color: "#6b7280", border: "none",
        fontSize: "18px", cursor: "pointer", lineHeight: 1
      }}>×</button>
    </div>
  );
}
