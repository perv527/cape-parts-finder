"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      fetchSales();
      setAuthChecked(true);
    });
  }, []);

  function getFilteredSales() {
    const now = new Date();
    return sales.filter(s => {
      const d = new Date(s.created_at);
      if (dateFilter === "today") return d.toDateString() === now.toDateString();
      if (dateFilter === "week") { const w = new Date(now); w.setDate(now.getDate()-7); return d >= w; }
      if (dateFilter === "month") return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
      if (dateFilter === "year") return d.getFullYear()===now.getFullYear();
      if (startDate && endDate) { const s2=new Date(startDate),e=new Date(endDate); e.setHours(23,59,59); return d>=s2&&d<=e; }
      return true;
    });
  }

  function exportToCSV(data: any[]) {
    const headers = ["Customer","Vehicle","Part","Supplier Cost","Selling Price","Profit","Status","Date"];
    const rows = data.map(s => [s.customer_name,s.vehicle,s.part_name,`R${Number(s.supplier_price).toFixed(2)}`,`R${Number(s.selling_price).toFixed(2)}`,`R${Number(s.profit).toFixed(2)}`,s.status,new Date(s.created_at).toLocaleDateString("en-ZA")]);
    const csv = [headers,...rows].map(r=>r.map(c=>`"${c||""}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`sales-${Date.now()}.csv`; a.click();
  }

  async function fetchSales() {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setSales(data || []);
  }

  const filtered = getFilteredSales();
  const totalRevenue  = filtered.reduce((sum, s) => sum + Number(s.selling_price || 0), 0);
  const totalProfit   = filtered.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const totalSales    = filtered.length;
  const averageProfit = totalSales > 0 ? totalProfit / totalSales : 0;

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="bg-white px-10 py-7 rounded-2xl border border-gray-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-gray-700 text-base font-medium">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9]">

      {/* â”€â”€ TOP NAV â”€â”€ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-orange-500 flex items-center justify-center flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-[15px] text-gray-900 leading-tight">Cape Parts Finder</div>
              <div className="text-[11px] text-gray-400">Admin Dashboard</div>
            </div>
          </div>
          <div className="flex gap-1">
            <a href="/admin"     className="px-4 py-1.5 rounded-lg text-sm no-underline text-gray-500 hover:bg-gray-50">Requests</a>
            <a href="/suppliers" className="px-4 py-1.5 rounded-lg text-sm no-underline text-gray-500 hover:bg-gray-50">Suppliers</a>
            <a href="/sales"     className="px-4 py-1.5 rounded-lg text-sm no-underline font-semibold bg-orange-50 text-orange-600">Sales</a>
          </div>
          <button onClick={() => { const filtered2 = getFilteredSales(); const headers = ["Customer","Supplier Cost","Selling Price","Profit","Date"]; const rows = filtered2.map(s=>[s.customer_name,s.supplier_price,s.selling_price,s.profit,new Date(s.created_at).toLocaleDateString("en-ZA")]); const csv=[headers,...rows].map(r=>r.map(c=>`"${c||""}"`).join(",")).join("\n"); const b=new Blob([csv],{type:"text/csv"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="sales.csv"; a.click(); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition cursor-pointer">
            Export CSV
          </button>
          <button onClick={fetchSales} title="Refresh"
            className="w-[34px] h-[34px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-7">

        {/* â”€â”€ PAGE HEADER â”€â”€ */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Sales Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Revenue, profit and completed sales overview</p>
        </div>

        {/* â”€â”€ STATS CARDS â”€â”€ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {[
            { label: "Total Revenue",  value: `R${totalRevenue.toFixed(2)}`,  accent: "#22C55E", color: "#15803D" },
            { label: "Total Profit",   value: `R${totalProfit.toFixed(2)}`,   accent: "#3B82F6", color: "#1D4ED8" },
            { label: "Total Sales",    value: String(totalSales),             accent: "#A855F7", color: "#7E22CE" },
            { label: "Avg Profit",     value: `R${averageProfit.toFixed(2)}`, accent: "#F97316", color: "#C2410C" },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: card.accent }} />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{card.label}</p>
              <p className="text-[30px] font-bold leading-none mt-2 tracking-tight" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* â”€â”€ SALES HISTORY â”€â”€ */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-gray-900">Sales History</h2>
          <span className="text-[12px] text-gray-400">{totalSales} {totalSales === 1 ? "sale" : "sales"} total</span>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-sm">No sales yet</p>
              <p className="text-gray-400 text-[12px] mt-1">Convert supplier quotes into sales to see them here</p>
            </div>
          )}

          {filtered.map((sale) => (
            <div key={sale.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Sale header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-bold text-[15px] flex-shrink-0">
                    {(sale.customer_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-gray-900">{sale.customer_name}</h3>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {new Date(sale.created_at).toLocaleString("en-ZA")}
                    </p>
                  </div>
                </div>
                <span className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-[12px] font-semibold">
                  {sale.status || "Completed"}
                </span>
              </div>

              {/* Sale body */}
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">Supplier Cost</p>
                    <p className="font-bold text-red-600 text-[18px] mt-1">R{Number(sale.supplier_price).toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide">Selling Price</p>
                    <p className="font-bold text-green-700 text-[18px] mt-1">R{Number(sale.selling_price).toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wide">Profit</p>
                    <p className="font-bold text-blue-700 text-[18px] mt-1">R{Number(sale.profit).toFixed(2)}</p>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </main>
  );
}







