"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DateFilter = "today" | "week" | "month" | "year" | "all";

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [savingNote, setSavingNote] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      fetchSales();
      setAuthChecked(true);
    });
  }, []);

  async function fetchSales() {
    const { data, error } = await supabase.from("sales").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setSales(data || []);
    const nm: Record<number, string> = {};
    (data || []).forEach((s: any) => { if (s.notes) nm[s.id] = s.notes; });
    setNotes(nm);
  }

  async function saveNote(id: number) {
    setSavingNote(id);
    await supabase.from("sales").update({ notes: notes[id] || "" }).eq("id", id);
    setSavingNote(null);
  }

  function getFilteredSales() {
    const now = new Date();
    return sales.filter(s => {
      const d = new Date(s.created_at);
      if (dateFilter === "today") return d.toDateString() === now.toDateString();
      if (dateFilter === "week") { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
      if (dateFilter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateFilter === "year") return d.getFullYear() === now.getFullYear();
      if (startDate && endDate) { const s2 = new Date(startDate), e = new Date(endDate); e.setHours(23, 59, 59); return d >= s2 && d <= e; }
      const q = search.toLowerCase();
      if (q && !(s.customer_name || "").toLowerCase().includes(q) && !(s.part_name || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function exportToCSV(data: any[]) {
    const headers = ["Customer", "Supplier Cost", "Selling Price", "Profit", "Status", "Notes", "Date"];
    const rows = data.map(s => [s.customer_name, `R${Number(s.supplier_price).toFixed(2)}`, `R${Number(s.selling_price).toFixed(2)}`, `R${Number(s.profit).toFixed(2)}`, s.status, s.notes || "", new Date(s.created_at).toLocaleDateString("en-ZA")]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `sales-${Date.now()}.csv`; a.click();
  }

  const filtered = getFilteredSales();
  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.selling_price || 0), 0);
  const totalProfit = filtered.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const totalSales = filtered.length;
  const avgProfit = totalSales > 0 ? totalProfit / totalSales : 0;

  const darkBg = { background: "#111111", minHeight: "100vh" };
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };

  const filters: { key: DateFilter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "year", label: "This Year" },
    { key: "all", label: "All Time" },
  ];

  if (!authChecked) {
    return (
      <main style={darkBg} className="flex items-center justify-center">
        <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 32px" }}>
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-gray-300 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={darkBg}>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* NAV */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", background: "rgba(17,17,17,0.85)", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 16px rgba(249,115,22,0.35)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <span className="font-bold text-white text-[14px]">Cape Parts Finder</span>
            </div>
            <div className="flex gap-1">
              {[
                { label: "Requests", href: "/admin" },
                { label: "Suppliers", href: "/suppliers" },
                { label: "Sales", href: "/sales", active: true },
                { label: "Analytics", href: "/analytics" },
              ].map((n) => (
                <a key={n.href} href={n.href} className="px-3.5 py-1.5 rounded-lg text-[13px] no-underline transition font-medium"
                  style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }}>
                  {n.label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => exportToCSV(filtered)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
              <button onClick={fetchSales} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-5 py-6">

          {/* SEARCH */}
          <div className="mb-3">
            <input type="text" placeholder="Search by customer name or part..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none text-white placeholder-gray-600"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>

          {/* DATE FILTERS */}
          <div className="rounded-xl p-4 mb-5" style={cardStyle}>
            <div className="flex flex-wrap items-center gap-2">
              {filters.map(f => (
                <button key={f.key} onClick={() => { setDateFilter(f.key); setStartDate(""); setEndDate(""); }}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition cursor-pointer"
                  style={dateFilter === f.key && !startDate
                    ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)", color: "#fb923c" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                  {f.label}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setDateFilter("all"); }}
                  className="rounded-lg px-3 py-1.5 text-[12px] outline-none text-white cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
                <span className="text-gray-600 text-sm">→</span>
                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setDateFilter("all"); }}
                  className="rounded-lg px-3 py-1.5 text-[12px] outline-none text-white cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Revenue", value: `R${totalRevenue.toFixed(2)}`, color: "#4ade80" },
              { label: "Total Profit",  value: `R${totalProfit.toFixed(2)}`,  color: "#60a5fa" },
              { label: "Total Sales",   value: String(totalSales),            color: "#c084fc" },
              { label: "Avg Profit",    value: `R${avgProfit.toFixed(2)}`,    color: "#fb923c" },
            ].map((card, i) => (
              <div key={i} className="rounded-xl p-4 relative overflow-hidden" style={cardStyle}>
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: card.color }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{card.label}</p>
                <p className="text-[28px] font-black leading-none" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* SALES LIST */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[15px] text-white">Sales History</h2>
            <span className="text-[12px] text-gray-600">{totalSales} {totalSales === 1 ? "sale" : "sales"}</span>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="rounded-xl p-10 text-center" style={cardStyle}>
                <p className="text-gray-600 text-sm">No sales found</p>
              </div>
            )}

            {filtered.map((sale) => {
              const isExpanded = expandedId === sale.id;
              const hasNote = !!(notes[sale.id] || sale.notes);

              return (
                <div key={sale.id} className="rounded-xl overflow-hidden transition" style={cardStyle}>

                  <div className="px-4 py-3 flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                    style={{ borderBottom: isExpanded ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0 text-green-400"
                      style={{ background: "rgba(34,197,94,0.1)" }}>
                      {(sale.customer_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13px] text-white">{sale.customer_name}</span>
                        {hasNote && (
                          <span style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c", borderRadius: 999, fontSize: 9, fontWeight: 700, padding: "1px 6px" }}>
                            Note
                          </span>
                        )}
                      </div>
                      <span className="text-gray-600 text-[11px]">{new Date(sale.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-[14px]" style={{ color: "#60a5fa" }}>R{Number(sale.profit).toFixed(0)}</span>
                      <span className="text-[10px] text-gray-600">profit</span>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
                        {sale.status || "Completed"}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-3 gap-3 py-3">
                        <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(239,68,68,0.5)" }}>Supplier Cost</p>
                          <p className="font-black text-[16px]" style={{ color: "#f87171" }}>R{Number(sale.supplier_price).toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)" }}>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(34,197,94,0.5)" }}>Selling Price</p>
                          <p className="font-black text-[16px]" style={{ color: "#4ade80" }}>R{Number(sale.selling_price).toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.1)" }}>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(59,130,246,0.5)" }}>Profit</p>
                          <p className="font-black text-[16px]" style={{ color: "#60a5fa" }}>R{Number(sale.profit).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="rounded-lg p-3 mt-1" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Notes</p>
                        <textarea
                          value={notes[sale.id] || ""}
                          onChange={(e) => setNotes(prev => ({ ...prev, [sale.id]: e.target.value }))}
                          placeholder="Add delivery details, payment notes, customer feedback..."
                          rows={3}
                          className="w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none text-gray-300 placeholder-gray-700"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-700">{(notes[sale.id] || "").length} chars</span>
                          <button onClick={() => saveNote(sale.id)} disabled={savingNote === sale.id}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition"
                            style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
                            {savingNote === sale.id ? "Saving..." : "Save Note"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

        </div>
      </div>
    </main>
  );
}
