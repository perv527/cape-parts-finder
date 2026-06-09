import struct, zlib, os, math

# 1. Fix OfflineBanner - simplify logic
banner = '''"use client";
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
'''
open("frontend/components/OfflineBanner.tsx", "w", encoding="utf-8").write(banner)
print("Fixed OfflineBanner!")

# 2. Create proper wrench icon PNG
def create_icon(size, filename):
    w = h = size
    pixels = []

    # Draw orange rounded square with white wrench
    cx, cy = w / 2, h / 2
    radius = w * 0.22  # corner radius

    def in_rounded_rect(x, y):
        # Check if point is inside rounded rectangle
        margin = w * 0.04
        x1, y1 = margin, margin
        x2, y2 = w - margin, h - margin
        r = radius
        # Check corners
        if x < x1 + r and y < y1 + r:
            return math.sqrt((x - (x1+r))**2 + (y - (y1+r))**2) <= r
        if x > x2 - r and y < y1 + r:
            return math.sqrt((x - (x2-r))**2 + (y - (y1+r))**2) <= r
        if x < x1 + r and y > y2 - r:
            return math.sqrt((x - (x1+r))**2 + (y - (y2-r))**2) <= r
        if x > x2 - r and y > y2 - r:
            return math.sqrt((x - (x2-r))**2 + (y - (y2-r))**2) <= r
        return x1 <= x <= x2 and y1 <= y <= y2

    def in_wrench(x, y):
        # Normalize to -1..1
        nx = (x - cx) / (w * 0.35)
        ny = (y - cy) / (h * 0.35)

        # Wrench handle - diagonal bar
        # Rotate 45 degrees
        angle = math.pi / 4
        rx = nx * math.cos(angle) + ny * math.sin(angle)
        ry = -nx * math.sin(angle) + ny * math.cos(angle)

        handle = abs(rx) < 0.18 and -0.9 < ry < 0.5

        # Wrench head - circle with cutout at top-left
        head_cx, head_cy = -0.45, -0.45
        head_r = 0.42
        in_head_outer = math.sqrt((nx - head_cx)**2 + (ny - head_cy)**2) < head_r
        in_head_inner = math.sqrt((nx - head_cx)**2 + (ny - head_cy)**2) < head_r * 0.5

        # Opening in wrench head
        opening_angle = math.atan2(ny - head_cy, nx - head_cx)
        in_opening = (math.pi * 0.1 < opening_angle < math.pi * 0.6) and in_head_inner

        head = in_head_outer and not in_opening

        return handle or head

    raw_data = b""
    for y in range(h):
        raw_data += b"\x00"
        for x in range(w):
            if in_rounded_rect(x, y):
                if in_wrench(x, y):
                    raw_data += bytes([255, 255, 255, 255])  # white
                else:
                    raw_data += bytes([249, 115, 22, 255])  # orange
            else:
                raw_data += bytes([0, 0, 0, 0])  # transparent

    compressed = zlib.compress(raw_data)

    def chunk(name, data):
        c = name + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)

    png = b"\x89PNG\r\n\x1a\n"
    # RGBA = color type 6
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", compressed)
    png += chunk(b"IEND", b"")
    open(filename, "wb").write(png)
    print(f"Created {filename} ({size}x{size})")

# Create both sizes (smaller size for speed)
create_icon(192, "frontend/public/icon-192.png")
create_icon(512, "frontend/public/icon-512.png")

print("\nAll done!")
