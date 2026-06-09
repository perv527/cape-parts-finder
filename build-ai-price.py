import os

# 1. Create the API route
os.makedirs("frontend/app/api/suggest-price", exist_ok=True)

route = '''import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { partName, vehicle, supplierPrice, pastSales } = await req.json();

    const salesContext = pastSales && pastSales.length > 0
      ? pastSales.map((s: any) =>
          `- ${s.notes || "Part"}: cost R${s.supplier_price}, sold R${s.selling_price}, profit R${s.profit} (${Math.round((s.profit / s.supplier_price) * 100)}% markup)`
        ).join("\\n")
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
'''
open("frontend/app/api/suggest-price/route.ts", "w", encoding="utf-8").write(route)
print("Created API route!")

# 2. Add AI suggestion to quotes page
path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

# Add state for AI suggestion
old_state = '  const [saving, setSaving] = useState(false);'
new_state = '''  const [saving, setSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# Add AI fetch function before saveQuote
old_save = '  async function saveQuote() {'
new_save = '''  async function getAiSuggestion() {
    if (!price || parseFloat(price) <= 0) {
      alert("Enter the supplier price first");
      return;
    }
    setLoadingAi(true);
    setAiSuggestion(null);
    try {
      const vehicle = `${request?.vehicle_year || ""} ${request?.vehicle_make || ""} ${request?.vehicle_model || ""}`.trim();
      const res = await fetch("/api/suggest-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partName: request?.part_needed || "part",
          vehicle,
          supplierPrice: parseFloat(price),
          pastSales: sales.slice(0, 10),
        }),
      });
      const data = await res.json();
      if (data.markup) {
        setAiSuggestion(data);
        setMarkup(String(data.markup));
      }
    } catch (err) {
      alert("AI suggestion failed. Please try again.");
    }
    setLoadingAi(false);
  }

  async function saveQuote() {'''
c = c.replace(old_save, new_save, 1)

# Add sales state to fetch
old_sales_state = '  const [quotes, setQuotes] = useState<any[]>([]);'
new_sales_state = '''  const [quotes, setQuotes] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);'''
c = c.replace(old_sales_state, new_sales_state, 1)

# Fetch sales alongside quotes
old_fetch = '    const { data: supplierData } = await supabase.from("suppliers").select("*").order("name");'
new_fetch = '''    const { data: supplierData } = await supabase.from("suppliers").select("*").order("name");
    const { data: salesData } = await supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(20);
    setSales(salesData || []);'''
c = c.replace(old_fetch, new_fetch, 1)

# Add AI button and suggestion display after markup quick buttons
old_markup_label = '              <label className="text-[11px] text-gray-500 mb-1 block">Markup %</label>'
new_markup_label = '''              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-gray-500">Markup %</label>
                <button onClick={getAiSuggestion} disabled={loadingAi}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                  {loadingAi ? "Thinking..." : "AI Suggest"}
                </button>
              </div>
              {aiSuggestion && (
                <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold" style={{ color: "#a78bfa" }}>AI Suggestion</span>
                    <span className="text-[12px] font-bold" style={{ color: "#a78bfa" }}>{aiSuggestion.markup}% markup</span>
                  </div>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-gray-500">Suggested price</span>
                    <span className="text-white font-semibold">R{aiSuggestion.selling_price}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">{aiSuggestion.reason}</p>
                </div>
              )}'''
c = c.replace(old_markup_label, new_markup_label, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has getAiSuggestion:", "getAiSuggestion" in c)
print("has AI Suggest button:", "AI Suggest" in c)
print("has API route:", os.path.exists("frontend/app/api/suggest-price/route.ts"))
