import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Only these columns are ever sent to the browser. Internal fields
// (email, extra_details, referral_source, photos, and any admin/supplier/
// cost columns) are deliberately excluded.
const PUBLIC_COLUMNS = [
  "id",
  "status",
  "part_needed",
  "part_preference",
  "customer_name",
  "vehicle_make",
  "vehicle_model",
  "vehicle_year",
  "vin_number",
  "area",
  "created_at",
  "updated_at",
].join(",");

// --- Simple in-memory rate limiter (per server instance) ---
// Blocks rapid phone-number enumeration from a single IP.
const RATE_LIMIT = 8;          // max requests
const RATE_WINDOW_MS = 60_000; // per 60 seconds
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // opportunistic cleanup so the map doesn't grow unbounded
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > RATE_LIMIT;
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { requests: [], error: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") return NextResponse.json({ requests: [] });

    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 7) return NextResponse.json({ requests: [] });

    // Normalise the caller's number to its 9 significant digits
    // (SA mobile: drop leading 0 / 27 country code).
    const callerLast9 = cleaned.replace(/^27/, "").replace(/^0/, "").slice(-9);
    if (callerLast9.length < 9) return NextResponse.json({ requests: [] });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // phone_number is fetched only for server-side matching; it is
    // stripped out below and never returned to the browser.
    const { data, error } = await admin
      .from("parts_requests")
      .select(PUBLIC_COLUMNS + ",phone_number")
      .ilike("phone_number", "%" + callerLast9 + "%")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      return NextResponse.json({ requests: [] });
    }

    // Exact match on the 9 significant digits — avoids returning
    // a different customer's order when digit sequences overlap.
    const matched = (data || [])
      .filter((r: any) => {
        const rc = String(r.phone_number || "").replace(/\D/g, "");
        const rcLast9 = rc.replace(/^27/, "").replace(/^0/, "").slice(-9);
        return rcLast9 === callerLast9;
      })
      .map((r: any) => {
        const { phone_number, ...safe } = r; // drop phone_number from response
        return safe;
      });

    return NextResponse.json({ requests: matched });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ requests: [] });
  }
}
