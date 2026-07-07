import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer /i, "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { partName, vehicle, supplierPrice, pastSales } = await req.json();

    const salesContext = pastSales && pastSales.length > 0
      ? pastSales.map((s: any) =>
          `- ${s.notes || "Part"}: cost R${s.supplier_price}, sold R${s.selling_price}, profit R${s.profit} (${Math.round((s.profit / s.supplier_price) * 100)}% markup)`
        ).join("\n")
      : "No past sales data yet.";

    const prompt = `You are a pricing advisor for Cape Parts Finder, a car parts sourcing business in Cape Town, South Africa.

The admin is adding a quote for a customer and needs pricing advice.

Part requested: ${partName}
Vehicle: ${vehicle}
Supplier cost: R${supplierPrice}

Past sales for similar parts:
${salesContext}

Based on this data, suggest:
1. The ideal markup percentage (be specific, e.g. 20%)
2. The recommended selling price in Rands
3. A brief one-sentence reason (max 15 words)

Respond in this exact JSON format only, no other text:
{"markup": 20, "selling_price": 420, "reason": "Similar parts average 20% markup in your sales history."}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "API error" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content[0]?.text || "{}";

    try {
      const result = JSON.parse(text.replace(/```json|```/g, "").trim());
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: "Parse error" }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
