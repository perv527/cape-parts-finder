import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") return NextResponse.json({ requests: [] });
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 7) return NextResponse.json({ requests: [] });
    const variants = [cleaned, "27" + cleaned.replace(/^0/, ""), "0" + cleaned.replace(/^27/, "")];
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const last9 = cleaned.slice(-9);
    const { data, error } = await admin.from("parts_requests").select("*").ilike("phone_number", "%" + last9 + "%").order("created_at", { ascending: false }).limit(20);
    if (error) { console.error(error); return NextResponse.json({ requests: [] }); }
    const matched = (data || []).filter((r: any) => {
      const rc = (r.phone_number || "").replace(/\D/g, "");
      return variants.some((v) => rc === v || rc.endsWith(v) || v.endsWith(rc));
    });
    return NextResponse.json({ requests: matched });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ requests: [] });
  }
}