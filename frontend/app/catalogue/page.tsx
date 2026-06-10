"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["All", "Engine", "Brakes", "Suspension", "Electrical", "Body", "Transmission", "Cooling", "Exhaust", "Tyres", "Other"];

const CAT_ICONS: Record<string, string> = {
  Engine: "⚙️", Brakes: "🛑", Suspension: "🔩", Electrical: "⚡",
  Body: "🚗", Transmission: "🔧", Cooling: "❄️", Exhaust: "💨",
  Tyres: "⭕", Other: "📦",
};

export default function CataloguePage() {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      fetchParts();
    });
  }, []);

  async function fetchParts() {
    setLoading(true);
    const { data } = await supabase.from("parts_catalogue").select("*").order("popular", { ascending: false }).order("part_name");
    setParts(data || []);
    setLoading(false);
  }

  const filtered = parts.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.part_name.toLowerCase().includes(q) || (p.notes || "").toLowerCase().includes(q);
    const matchCat = cat === "All" || p.category === cat;
    return matchSearch && matchCat;
  });

  const popular = filtered.filter(p => p.popular);
  const regular = filtered.filter(p => !p.popular);

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a" }} className="flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px" }}>
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-gray-300 text-sm">Loading catalogue...</p>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", overflowX: "hidden" as const }}>
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.07) 0%,transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* NAV */}
        <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 0 20px rgba(249,115,22,0.4)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div>
                <div className="font-black text-white text-[15px] leading-none">Cape Parts Finder</div>
                <div className="text-[10px] text-orange-400/70 leading-none mt-0.5">Parts Catalogue</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/track" className="px-3 py-1.5 rounded-lg text-[12px] font-medium no-underline transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                Track Request
              </a>
              <a href="/" className="px-3 py-1.5 rounded-lg text-[12px] font-bold no-underline transition text-white"
                style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", border: "none" }}>
                Request Part
              </a>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* HERO */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] sm:text-[40px] font-black text-white leading-tight mb-3">
              Parts Catalogue
            </h1>
            <p className="text-gray-400 text-[15px] max-w-md mx-auto">
              Browse common parts and typical price ranges. Click any part to request it instantly.
            </p>
          </div>

          {/* SEARCH */}
          <div className="mb-5">
            <input type="text" placeholder="Search parts..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-2xl px-5 py-3.5 text-[14px] outline-none text-white placeholder-gray-600"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>

          {/* CATEGORY FILTER */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition whitespace-nowrap flex-shrink-0"
                style={cat === c
                  ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                {c !== "All" && CAT_ICONS[c]} {c}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-white font-semibold text-[16px] mb-2">No parts found</p>
              <p className="text-gray-500 text-[13px]">Try a different search or category</p>
              <a href="/" className="inline-block mt-4 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white no-underline"
                style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                Request any part →
              </a>
            </div>
          ) : (
            <>
              {/* POPULAR */}
              {popular.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Most Popular</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {popular.map(p => <PartCard key={p.id} part={p} />)}
                  </div>
                </div>
              )}

              {/* ALL PARTS */}
              {regular.length > 0 && (
                <div>
                  {popular.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>All Parts</span>
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {regular.map(p => <PartCard key={p.id} part={p} />)}
                  </div>
                </div>
              )}
            </>
          )}

          {/* CTA */}
          <div className="mt-10 rounded-2xl p-6 text-center" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
            <p className="text-white font-bold text-[16px] mb-1">Can't find what you need?</p>
            <p className="text-gray-400 text-[13px] mb-4">We source any part — just submit a request and we'll find it for you</p>
            <a href="/" className="inline-block px-6 py-3 rounded-xl text-[14px] font-bold text-white no-underline"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }}>
              Submit a Request 🔧
            </a>
          </div>

          <p className="text-center text-gray-700 text-[12px] mt-6 pb-4">
            Cape Parts Finder · Cape Town & Surrounds · Free Service
          </p>
        </div>
      </div>
    </main>
  );
}

function PartCard({ part }: { part: any }) {
  const hasPrice = part.typical_cost_min || part.typical_cost_max;
  return (
    <a href={`/?part=${encodeURIComponent(part.part_name)}`}
      className="block rounded-2xl p-4 no-underline transition-all cursor-pointer"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(249,115,22,0.3)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-white text-[14px]">{part.part_name}</span>
            {part.popular && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>Popular</span>}
          </div>
          {part.category && (
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {CAT_ICONS[part.category]} {part.category}
            </span>
          )}
          {part.notes && <p className="text-[12px] text-gray-600 mt-1">{part.notes}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          {hasPrice ? (
            <>
              <div className="font-black text-[14px]" style={{ color: "#4ade80" }}>
                {part.typical_cost_min && part.typical_cost_max
                  ? `R${Number(part.typical_cost_min).toFixed(0)}–R${Number(part.typical_cost_max).toFixed(0)}`
                  : part.typical_cost_min
                  ? `From R${Number(part.typical_cost_min).toFixed(0)}`
                  : `Up to R${Number(part.typical_cost_max).toFixed(0)}`}
              </div>
              <div className="text-[10px] text-gray-600">typical price</div>
            </>
          ) : (
            <div className="text-[12px]" style={{ color: "rgba(249,115,22,0.6)" }}>Request quote →</div>
          )}
        </div>
      </div>
    </a>
  );
}
