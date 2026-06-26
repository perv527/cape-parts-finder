"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DateFilter = "today" | "week" | "month" | "year" | "all";

const INVOICE_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter','Helvetica Neue',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:11.5px;line-height:1.45;}
.page{max-width:720px;margin:0 auto;padding:36px 44px;}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;}
.logo-wrap{display:flex;align-items:center;gap:11px;}
.logo-box{width:38px;height:38px;background:#f97316;border-radius:9px;display:flex;align-items:center;justify-content:center;}
.logo-box svg{width:19px;height:19px;}
.brand-name{font-size:16px;font-weight:800;color:#0a0a0a;}
.brand-sub{font-size:9.5px;color:#aaa;margin-top:2px;}
.inv-info{text-align:right;}
.inv-tag{font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:2.5px;color:#ccc;margin-bottom:3px;}
.inv-num{font-size:17px;font-weight:900;color:#0a0a0a;}
.inv-badge{display:inline-block;margin-top:6px;background:#14b8a6;color:white;font-size:9px;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;}
.inv-meta{font-size:9.5px;color:#aaa;margin-top:4px;line-height:1.7;}
.accent-line{height:1.5px;background:linear-gradient(90deg,#f97316 0%,#fdba74 50%,#fff 100%);margin-bottom:20px;}
.sec{font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:2.5px;color:#ccc;margin-bottom:8px;}
.panel{padding:13px 18px;border:1px solid #e8e8e8;border-radius:8px;margin-bottom:20px;}
.panel-row{display:flex;justify-content:space-between;align-items:baseline;padding:3.5px 0;}
.panel-row+.panel-row{border-top:1px solid #f3f3f3;}
.pl{font-size:9.5px;color:#bbb;font-weight:500;}
.pv{font-size:10.5px;font-weight:600;color:#1a1a1a;text-align:right;}
.paid-stamp{text-align:center;padding:16px;margin-bottom:20px;border-radius:10px;background:rgba(20,184,166,0.06);border:2px solid rgba(20,184,166,0.3);}
.paid-text{font-size:32px;font-weight:900;color:#14b8a6;letter-spacing:4px;opacity:0.8;}
.paid-sub{font-size:10px;color:#aaa;margin-top:4px;}
.pricing-wrap{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:18px;align-items:start;}
.price-table{width:100%;border-collapse:collapse;}
.price-table td{padding:5.5px 0;font-size:11px;vertical-align:baseline;}
.price-table tr+tr td{border-top:1px solid #f0f0f0;}
.pt-label{color:#888;width:60%;}
.pt-value{text-align:right;font-weight:600;color:#333;}
.price-total td{border-top:1.5px solid #1a1a1a!important;padding-top:8px;}
.pt-total-label{font-size:12px;font-weight:800;color:#0a0a0a;}
.pt-total-value{font-size:21px;font-weight:900;color:#14b8a6;text-align:right;}
.bank-table{width:100%;border-collapse:collapse;}
.bank-table td{padding:5px 0;font-size:10px;vertical-align:baseline;}
.bank-table tr+tr td{border-top:1px solid #f0f0f0;}
.bl{color:#bbb;font-weight:500;width:45%;}
.bv{text-align:right;font-weight:700;color:#1a1a1a;}
.bv.accent{color:#14b8a6;font-size:11px;}
.disclaimer{border:1px solid #efefef;border-radius:7px;padding:11px 15px;margin-bottom:18px;}
.disclaimer p{font-size:8.5px;color:#999;line-height:1.7;}
.footer{display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid #e8e8e8;}
.footer-left .fb{font-size:11px;font-weight:800;color:#0a0a0a;}
.footer-left .ft{font-size:8.5px;color:#ccc;margin-top:2px;}
.footer-right{text-align:right;}
.footer-right div{font-size:8.5px;color:#aaa;line-height:1.85;}
.footer-right .fo{color:#14b8a6;font-weight:700;font-size:10px;}
@media print{@page{size:A4;margin:10mm;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{padding:20px 30px;}}
`;

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

  async function getNextInvoiceNum() {
    const { data } = await supabase.from("invoice_counter").select("*").eq("id", 1).single();
    const next = ((data?.last_invoice_number) || 0) + 1;
    await supabase.from("invoice_counter").update({ last_invoice_number: next, updated_at: new Date().toISOString() }).eq("id", 1);
    return "INV-" + String(next).padStart(4, "0");
  }

  async function printInvoice(sale: any) {
    const invNum = await getNextInvoiceNum();
    const date = new Date(sale.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
    const base = Number(sale.selling_price);
    const vat = base * 0.15;
    const total = base + vat;
    const logoSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';

    const html = "<!DOCTYPE html><html><head><meta charset='UTF-8'/><title>Invoice " + invNum + "</title><style>" + INVOICE_STYLES + "</style></head><body><div class='page'>"
      + "<div class='header'><div class='logo-wrap'><div class='logo-box'>" + logoSvg + "</div><div><div class='brand-name'>Cape Parts Finder</div><div class='brand-sub'>Your Trusted Auto Parts Network &middot; Cape Town</div></div></div>"
      + "<div class='inv-info'><div class='inv-tag'>Tax Invoice</div><div class='inv-num'>" + invNum + "</div><div class='inv-badge'>&#10003; PAID</div><div class='inv-meta'>Date: " + date + "</div></div></div>"
      + "<div class='accent-line'></div>"
      + "<div class='panel'><div class='sec'>Invoiced To</div>"
      + "<div class='panel-row'><span class='pl'>Full Name</span><span class='pv'>" + (sale.customer_name || "—") + "</span></div>"
      + "<div class='panel-row'><span class='pl'>Phone</span><span class='pv'>" + (sale.customer_phone || "—") + "</span></div>"
      + "<div class='panel-row'><span class='pl'>Status</span><span class='pv'>" + (sale.status || "Completed") + "</span></div>"
      + (notes[sale.id] ? "<div class='panel-row'><span class='pl'>Notes</span><span class='pv' style='max-width:60%;text-align:right;'>" + notes[sale.id] + "</span></div>" : "")
      + "</div>"
      + "<div class='paid-stamp'><div class='paid-text'>PAID</div><div class='paid-sub'>Thank you for your payment &middot; Cape Parts Finder</div></div>"
      + "<div class='pricing-wrap'><div><div class='sec'>Invoice Summary</div><table class='price-table'>"
      + "<tr><td class='pt-label'>Part &amp; Sourcing Fee</td><td class='pt-value'>R" + base.toFixed(2) + "</td></tr>"
      + "<tr><td class='pt-label'>VAT (15%)</td><td class='pt-value'>R" + vat.toFixed(2) + "</td></tr>"
      + "<tr class='price-total'><td class='pt-total-label'>Total Paid</td><td class='pt-total-value'>R" + total.toFixed(2) + "</td></tr>"
      + "</table><div style='font-size:8.5px;color:#bbb;margin-top:5px;'>All amounts in South African Rand (ZAR)</div></div>"
      + "<div><div class='sec'>Payment Details</div><table class='bank-table'>"
      + "<tr><td class='bl'>Bank</td><td class='bv'>First National Bank (FNB)</td></tr>"
      + "<tr><td class='bl'>Account Name</td><td class='bv'>Cape Parts Finder</td></tr>"
      + "<tr><td class='bl'>Account Number</td><td class='bv accent'>62863344596</td></tr>"
      + "<tr><td class='bl'>Account Type</td><td class='bv'>Savings Account</td></tr>"
      + "<tr><td class='bl'>Reference</td><td class='bv'>" + invNum + "</td></tr>"
      + "</table></div></div>"
      + "<div class='disclaimer'><p>This is an official tax invoice issued by Cape Parts Finder. Parts supplied are subject to supplier warranty only. Cape Parts Finder acts as intermediary and accepts no liability for fitment or compatibility issues. This invoice confirms payment received in full.</p></div>"
      + "<div class='footer'><div class='footer-left'><div class='fb'>Cape Parts Finder</div><div class='ft'>Connecting you with quality parts across Cape Town</div></div>"
      + "<div class='footer-right'><div class='fo'>+27 69 686 3952</div><div>capepartsfinder.co.za</div><div>Cape Town, South Africa</div></div></div>"
      + "</div></body></html>";

    const win = window.open("", "_blank");
    if (!win) { alert("Allow popups to print"); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
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
    const rows = data.map(s => [s.customer_name, "R" + Number(s.supplier_price).toFixed(2), "R" + Number(s.selling_price).toFixed(2), "R" + Number(s.profit).toFixed(2), s.status, s.notes || "", new Date(s.created_at).toLocaleDateString("en-ZA")]);
    const csv = [headers, ...rows].map(r => r.map(c => '"' + (c || "") + '"').join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sales-" + Date.now() + ".csv"; a.click();
  }

  const filtered = getFilteredSales();
  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.selling_price || 0), 0);
  const totalProfit = filtered.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const totalSales = filtered.length;
  const avgProfit = totalSales > 0 ? totalProfit / totalSales : 0;

  const darkBg = { background: "#111111", minHeight: "100vh", overflowX: "hidden" as const };
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

        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", background: "rgba(17,17,17,0.85)", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 16px rgba(249,115,22,0.35)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <span className="font-bold text-white text-[13px] hidden sm:block">CPF</span>
            </div>
            <div className="flex gap-1">
              {[
                { label: "Requests", href: "/admin" },
                { label: "Suppliers", href: "/suppliers" },
                { label: "Sales", href: "/sales" }, { label: "Customers", href: "/customers", active: true },
                { label: "Inventory", href: "/inventory" },
                { label: "Expenses", href: "/expenses" },
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

          <div className="mb-3">
            <input type="text" placeholder="Search by customer name or part..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none text-white placeholder-gray-600"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>

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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Revenue", value: "R" + totalRevenue.toFixed(2), color: "#4ade80" },
              { label: "Total Profit",  value: "R" + totalProfit.toFixed(0),  color: "#60a5fa" },
              { label: "Total Sales",   value: String(totalSales),             color: "#c084fc" },
              { label: "Avg Profit",    value: "R" + avgProfit.toFixed(2),     color: "#fb923c" },
            ].map((card, i) => (
              <div key={i} className="rounded-xl p-4 relative overflow-hidden" style={cardStyle}>
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: card.color }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{card.label}</p>
                <p className="text-[22px] font-black leading-none" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

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
                          <span style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c", borderRadius: 999, fontSize: 9, fontWeight: 700, padding: "1px 6px" }}>Note</span>
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

                      <button onClick={() => printInvoice(sale)}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-[12px] font-bold cursor-pointer transition mb-3 text-white"
                        style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", boxShadow: "0 4px 12px rgba(20,184,166,0.25)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Print Invoice
                      </button>
                      {sale.request_id && (
                        <button onClick={() => window.open("/quotes/" + sale.request_id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                          View Original Request
                        </button>
                      )}

                      <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
      </div>
    </main>
  );
}
