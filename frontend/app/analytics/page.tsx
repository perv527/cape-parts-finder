"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AnalyticsPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [target, setTarget] = useState<any>(null);
  const [targetModal, setTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState({ profit_target: "", revenue_target: "", sales_target: "" });
  const [savingTarget, setSavingTarget] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      await supabase.auth.refreshSession();
      const now = new Date();
      const monthKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: true }),
        supabase.from("parts_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").order("date", { ascending: false }),
        supabase.from("targets").select("*").eq("month", monthKey).maybeSingle(),
      ]).then(([{ data: s }, { data: r }, { data: e }, { data: t }]) => {
        setSales(s || []);
        setRequests(r || []);
        setExpenses(e || []);
        setTarget(t || null);
        if (t) setTargetForm({ profit_target: String(t.profit_target || ""), revenue_target: String(t.revenue_target || ""), sales_target: String(t.sales_target || "") });
        setAuthChecked(true);
      });
    });
  }, []);

  function isToday(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  function getPeriodSales() {
    const now = new Date();
    return sales.filter(s => {
      const d = new Date(s.created_at);
      if (period === "week") { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
      if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    });
  }

  function getChartData() {
    function getReferralSources() {
    const counts: Record<string, number> = {};
    requests.forEach(r => {
      if (r.referral_source) {
        counts[r.referral_source] = (counts[r.referral_source] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  const periodSales = getPeriodSales();
    const grouped: Record<string, { revenue: number; profit: number; count: number }> = {};
    periodSales.forEach(s => {
      const d = new Date(s.created_at);
      const key = period === "week"
        ? d.toLocaleDateString("en-ZA", { weekday: "short" })
        : period === "month"
        ? d.getDate().toString()
        : d.toLocaleDateString("en-ZA", { month: "short" });
      if (!grouped[key]) grouped[key] = { revenue: 0, profit: 0, count: 0 };
      grouped[key].revenue += Number(s.selling_price || 0);
      grouped[key].profit += Number(s.profit || 0);
      grouped[key].count += 1;
    });
    return Object.entries(grouped).map(([label, data]) => ({ label, ...data }));
  }

  function getTopParts() {
    const counts: Record<string, number> = {};
    requests.forEach(r => {
      const part = (r.part_needed || "Unknown").toLowerCase().trim();
      counts[part] = (counts[part] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([part, count]) => ({ part, count }));
  }

  function getStatusBreakdown() {
    const counts: Record<string, number> = {};
    requests.forEach(r => { const s = r.status || "New"; counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  function getTopMakes() {
    const counts: Record<string, number> = {};
    requests.forEach(r => { if (r.vehicle_make) counts[r.vehicle_make] = (counts[r.vehicle_make] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  }

  // Today's stats
  const todayRequests = requests.filter(r => isToday(r.created_at));
  const todaySales = sales.filter(s => isToday(s.created_at));
  const todayRevenue = todaySales.reduce((s, x) => s + Number(x.selling_price || 0), 0);
  const todayProfit = todaySales.reduce((s, x) => s + Number(x.profit || 0), 0);
  const staleCount = requests.filter(r => {
    const isClosed = (r.status || "New") === "Closed" || r.status === "Delivered";
    return !isClosed && (Date.now() - new Date(r.updated_at || r.created_at).getTime()) > 3 * 24 * 60 * 60 * 1000;
  }).length;

  // Activity feed — last 7 requests sorted by updated_at or created_at
  const recentActivity = [...requests]
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 6);

  const periodSales = getPeriodSales();
  const totalRevenue = periodSales.reduce((s, x) => s + Number(x.selling_price || 0), 0);
  const totalProfit = periodSales.reduce((s, x) => s + Number(x.profit || 0), 0);
  const totalSalesCount = periodSales.length;
  const conversionRate = requests.length > 0 ? ((sales.length / requests.length) * 100).toFixed(1) : "0";
  const chartData = getChartData();
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  const topParts = getTopParts();
  const maxPartCount = Math.max(...topParts.map(p => p.count), 1);
  const statusBreakdown = getStatusBreakdown();
  const topMakes = getTopMakes();
  const referralSources=(()=>{const co:Record<string,number>={};requests.forEach((r:any)=>{if(r.referral_source)co[r.referral_source]=(co[r.referral_source]||0)+1;});return Object.entries(co).sort((a,b)=>b[1]-a[1]);})();
  const maxReferral = Math.max(...referralSources.map(r => r[1]), 1);
  const maxMakeCount = Math.max(...topMakes.map(m => m[1]), 1);

  async function saveTarget() {
    setSavingTarget(true);
    const now = new Date();
    const monthKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const payload = {
      month: monthKey,
      profit_target: parseFloat(targetForm.profit_target) || 0,
      revenue_target: parseFloat(targetForm.revenue_target) || 0,
      sales_target: parseInt(targetForm.sales_target) || 0,
      updated_at: new Date().toISOString(),
    };
    if (target) {
      await supabase.from("targets").update(payload).eq("id", target.id);
    } else {
      await supabase.from("targets").insert([payload]);
    }
    setSavingTarget(false);
    setTargetModal(false);
    window.location.reload();
  }

  // Expense calculations
  const now2 = new Date();
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
  });
  const totalExpensesMonth = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const allTimeExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const allTimeProfit = sales.reduce((s, x) => s + Number(x.profit || 0), 0);
  const netProfit = allTimeProfit - allTimeExpenses;
  const periodExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    if (period === "week") { const w = new Date(now2); w.setDate(now2.getDate() - 7); return d >= w; }
    if (period === "month") return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
    return d.getFullYear() === now2.getFullYear();
  });
  const totalExpensesPeriod = periodExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfitPeriod = totalProfit - totalExpensesPeriod;

  // Target progress
  const now3 = new Date();
  const daysInMonth = new Date(now3.getFullYear(), now3.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now3.getDate();
  const profitPct = target && target.profit_target > 0 ? Math.min((totalProfit / target.profit_target) * 100, 100) : 0;
  const revenuePct = target && target.revenue_target > 0 ? Math.min((totalRevenue / target.revenue_target) * 100, 100) : 0;
  const salesPct = target && target.sales_target > 0 ? Math.min((totalSalesCount / target.sales_target) * 100, 100) : 0;

  function targetStatus(pct: number) {
    if (pct >= 100) return { label: "🎉 Achieved!", color: "#4ade80" };
    if (pct >= 80) return { label: "🔥 Almost there", color: "#fb923c" };
    if (pct >= 50) return { label: "📈 On track", color: "#60a5fa" };
    return { label: "⚠ Behind", color: "#f87171" };
  }

  // Best selling parts (from sales)
  function getBestSellingParts() {
    const counts: Record<string, { count: number; revenue: number }> = {};
    sales.forEach(s => {
      const part = (s.part_needed || s.part || "Unknown").toLowerCase().trim();
      if (!counts[part]) counts[part] = { count: 0, revenue: 0 };
      counts[part].count += 1;
      counts[part].revenue += Number(s.selling_price || 0);
    });
    return Object.entries(counts).sort((a, b) => b[1].count - a[1].count).slice(0, 6)
      .map(([part, data]) => ({ part, ...data }));
  }

  // Best day of week
  function getBestDays() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);
    requests.forEach(r => { counts[new Date(r.created_at).getDay()] += 1; });
    return days.map((day, i) => ({ day, count: counts[i] }));
  }

  // Peak hours
  function getPeakHours() {
    const counts = Array(24).fill(0);
    requests.forEach(r => { counts[new Date(r.created_at).getHours()] += 1; });
    return counts.map((count, hour) => ({
      hour: hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour-12}pm`,
      count
    })).filter(h => h.count > 0);
  }

  // Monthly trend (last 6 months)
  function getMonthlyTrend() {
    const months: Record<string, { requests: number; sales: number; revenue: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      months[key] = { requests: 0, sales: 0, revenue: 0 };
    }
    requests.forEach(r => {
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      if (months[key]) months[key].requests += 1;
    });
    sales.forEach(s => {
      const d = new Date(s.created_at);
      const key = d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      if (months[key]) { months[key].sales += 1; months[key].revenue += Number(s.selling_price || 0); }
    });
    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  }

  const bestParts = getBestSellingParts();
  const bestDays = getBestDays();
  const peakHours = getPeakHours();
  const monthlyTrend = getMonthlyTrend();
  const maxDayCount = Math.max(...bestDays.map(d => d.count), 1);
  const maxHourCount = Math.max(...peakHours.map(h => h.count), 1);
  const maxMonthRequests = Math.max(...monthlyTrend.map(m => m.requests), 1);
  const avgSaleValue = sales.length > 0 ? sales.reduce((s, x) => s + Number(x.selling_price || 0), 0) / sales.length : 0;
  const bestDay = bestDays.reduce((a, b) => a.count > b.count ? a : b, bestDays[0]);
  const peakHour = peakHours.reduce((a, b) => a.count > b.count ? a : b, peakHours[0]);

  const statusColors: Record<string, string> = {
    New: "#f97316", Searching: "#3b82f6", Quoted: "#22c55e",
    Ordered: "#a855f7", Delivered: "#14b8a6", Closed: "#6b7280",
  };

  const darkBg = { background: "#111111", minHeight: "100vh", overflowX: "hidden" as const };
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };

  if (!authChecked) {
    return (
      <main style={darkBg} className="flex items-center justify-center">
        <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 32px" }}>
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-gray-300 text-sm">Loading Analytics...</p>
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
              <span className="font-bold text-white text-[14px] hidden sm:block">Cape Parts Finder</span>
            </div>
            <div className="flex gap-1">
              {[{ label: "Requests", href: "/admin" }, { label: "Suppliers", href: "/suppliers" }, { label: "Sales", href: "/sales" }, { label: "Customers", href: "/customers" }, { label: "Inventory", href: "/inventory" }, { label: "Expenses", href: "/expenses" }, { label: "Analytics", href: "/analytics", active: true }].map((n) => (
                <a key={n.href} href={n.href} className="px-3.5 py-1.5 rounded-lg text-[13px] no-underline transition font-medium"
                  style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }}>
                  {n.label}
                </a>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(["week", "month", "year"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition capitalize"
                  style={period === p
                    ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                  {p === "week" ? "7D" : p === "month" ? "30D" : "1Y"}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-5 py-6">

          {/* TODAY'S SUMMARY */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  <h2 className="font-bold text-[15px] text-white">Today's Summary</h2>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}</p>
              </div>
              {staleCount > 0 && (
                <a href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold no-underline"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                  ⏰ {staleCount} need follow-up
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: "New Requests", value: todayRequests.length, color: "#f97316", icon: "📥" },
                { label: "Sales Today", value: todaySales.length, color: "#4ade80", icon: "✅" },
                { label: "Revenue Today", value: `R${todayRevenue.toFixed(0)}`, color: "#4ade80", icon: "💰" },
                { label: "Profit Today", value: `R${todayProfit.toFixed(0)}`, color: "#60a5fa", icon: "📈" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[16px]">{item.icon}</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{item.label}</p>
                  </div>
                  <p className="text-[26px] font-black leading-none" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* ACTIVITY FEED */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>Recent Activity</p>
              <div className="space-y-2">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-600 text-sm">No activity yet</p>
                ) : recentActivity.map((r) => {
                  const st = r.status || "New";
                  const color = statusColors[st] || "#6b7280";
                  return (
                    <div key={r.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] font-medium text-white">{r.customer_name}</span>
                        <span className="text-gray-600 text-[12px]"> · </span>
                        <span className="text-gray-400 text-[12px] truncate">{r.part_needed}</span>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${color}20`, color: color, border: `1px solid ${color}40` }}>
                        {st}
                      </span>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">{timeAgo(r.updated_at || r.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MONTHLY TARGETS */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-[15px] text-white">Monthly Targets</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{daysRemaining} days remaining · {now3.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</p>
              </div>
              <button onClick={() => setTargetModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
                {target ? "Edit Target" : "Set Target"}
              </button>
            </div>
            {!target ? (
              <div className="text-center py-6">
                <p className="text-gray-600 text-[13px] mb-3">No target set for this month</p>
                <button onClick={() => setTargetModal(true)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer text-white"
                  style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                  Set Monthly Target →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Profit", current: totalProfit, target: target.profit_target, pct: profitPct, color: "#60a5fa" },
                  { label: "Revenue", current: totalRevenue, target: target.revenue_target, pct: revenuePct, color: "#4ade80" },
                  { label: "Sales", current: totalSalesCount, target: target.sales_target, pct: salesPct, color: "#c084fc", isCount: true },
                ].filter(t => t.target > 0).map(t => {
                  const st = targetStatus(t.pct);
                  return (
                    <div key={t.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-white">{t.label}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}>{st.label}</span>
                        </div>
                        <span className="text-[12px] font-bold text-white">
                          {t.isCount ? `${t.current} / ${t.target}` : `R${t.current.toFixed(0)} / R${t.target.toFixed(0)}`}
                          <span className="text-gray-500 font-normal ml-1">({t.pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${t.pct}%`, background: t.pct >= 100 ? "#4ade80" : t.pct >= 80 ? "#fb923c" : t.pct >= 50 ? t.color : "#f87171" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h1 className="text-[22px] font-black text-white tracking-tight">Analytics</h1>
            <p className="text-gray-500 text-sm mt-0.5">Business performance overview</p>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Revenue", value: `R${totalRevenue.toFixed(0)}`, sub: `${period}`, color: "#4ade80", glow: "rgba(34,197,94,0.1)" },
              { label: "Profit", value: `R${totalProfit.toFixed(0)}`, sub: `${period}`, color: "#60a5fa", glow: "rgba(59,130,246,0.1)" },
              { label: "Expenses", value: `R${totalExpensesPeriod.toFixed(0)}`, sub: `${period}`, color: "#f87171", glow: "rgba(239,68,68,0.08)" },
              { label: "Net Profit", value: `R${netProfitPeriod.toFixed(0)}`, sub: "after expenses", color: netProfitPeriod >= 0 ? "#4ade80" : "#f87171", glow: netProfitPeriod >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)" },
              { label: "Sales", value: totalSalesCount.toString(), sub: `${period}`, color: "#c084fc", glow: "rgba(168,85,247,0.1)" },
              { label: "Conversion", value: `${conversionRate}%`, sub: "requests → sales", color: "#fb923c", glow: "rgba(249,115,22,0.1)" },
            ].map((card) => (
              <div key={card.label} className="rounded-xl p-5 relative overflow-hidden" style={{ background: card.glow, border: `1px solid ${card.color}22` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${card.color}99` }}>{card.label}</p>
                <p className="text-[32px] font-black leading-none" style={{ color: card.color }}>{card.value}</p>
                <p className="text-[10px] mt-1 capitalize" style={{ color: `${card.color}66` }}>{card.sub}</p>
              </div>
            ))}
          </div>

          {/* REVENUE CHART */}
          <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[14px] text-white">Revenue & Profit</h2>
                <p className="text-[11px] text-gray-600 mt-0.5">Over selected period</p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />Revenue</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Profit</div>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No sales data for this period</div>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-32">
                      <div className="flex-1 rounded-t-md transition-all" style={{ height: `${(d.revenue / maxRevenue) * 100}%`, background: "rgba(34,197,94,0.5)", minHeight: 2 }} />
                      <div className="flex-1 rounded-t-md transition-all" style={{ height: `${(d.profit / maxRevenue) * 100}%`, background: "rgba(59,130,246,0.5)", minHeight: 2 }} />
                    </div>
                    <span className="text-[9px] text-gray-600 truncate w-full text-center">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-5">

            {/* TOP PARTS */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-4">Top Requested Parts</h2>
              {topParts.length === 0 ? (
                <p className="text-gray-600 text-sm">No requests yet</p>
              ) : (
                <div className="space-y-2.5">
                  {topParts.map(({ part, count }, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-gray-300 font-medium capitalize truncate max-w-[200px]">{part}</span>
                        <span className="text-[11px] text-gray-500">{count} req{count !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxPartCount) * 100}%`, background: "linear-gradient(90deg, #f97316, #fb923c)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STATUS BREAKDOWN */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-4">Requests by Status</h2>
              {statusBreakdown.length === 0 ? (
                <p className="text-gray-600 text-sm">No requests yet</p>
              ) : (
                <div className="space-y-2.5">
                  {statusBreakdown.map(([status, count]) => {
                    const color = statusColors[status] || "#6b7280";
                    const total = requests.length;
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                            <span className="text-[12px] text-gray-300 font-medium">{status}</span>
                          </div>
                          <span className="text-[11px] text-gray-500">{count} ({((count / total) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${(count / total) * 100}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* TOP VEHICLE MAKES */}
          <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
            <h2 className="font-bold text-[14px] text-white mb-4">Top Vehicle Makes</h2>
            {topMakes.length === 0 ? (
              <p className="text-gray-600 text-sm">No requests yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {topMakes.map(([make, count]) => (
                  <div key={make} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-[22px] font-black text-white mb-1">{count}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{make}</div>
                    <div className="mt-2 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(count / maxMakeCount) * 100}%`, background: "rgba(249,115,22,0.6)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REFERRAL SOURCES */}
          {referralSources.length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-4">How Customers Found Us</h2>
              <div className="space-y-2.5">
                {referralSources.map(([source, count]) => (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-gray-300 font-medium">{source}</span>
                      <span className="text-[11px] text-gray-500">{count} customer{count !== 1 ? "s" : ""} ({((count / requests.filter(r => r.referral_source).length) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxReferral) * 100}%`, background: "linear-gradient(90deg, #f97316, #fb923c)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BEST SELLING PARTS */}
          {bestParts.length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-4">Best Selling Parts</h2>
              <div className="space-y-2.5">
                {bestParts.map(({ part, count, revenue }, i) => (
                  <div key={part}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-600">#{i+1}</span>
                        <span className="text-[12px] text-gray-300 font-medium capitalize">{part}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-[11px] text-gray-500">{count} sold</span>
                        <span className="text-[12px] font-bold" style={{ color: "#4ade80" }}>R{revenue.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(count / bestParts[0].count) * 100}%`, background: "linear-gradient(90deg,#f97316,#fb923c)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BEST DAY + PEAK HOUR + AVG SALE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-1">Busiest Day</h2>
              <p className="text-[11px] text-gray-600 mb-4">Requests by day of week</p>
              <div className="flex items-end gap-1 h-24">
                {bestDays.map(d => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm transition-all"
                      style={{ height: `${maxDayCount > 0 ? (d.count / maxDayCount) * 80 : 0}px`, background: bestDay && d.day === bestDay.day ? "#f97316" : "rgba(249,115,22,0.3)", minHeight: d.count > 0 ? 4 : 0 }} />
                    <span className="text-[9px] text-gray-600">{d.day}</span>
                  </div>
                ))}
              </div>
              {bestDay && bestDay.count > 0 && <p className="text-[11px] mt-2" style={{ color: "#fb923c" }}>{bestDay.day} is your busiest day</p>}
            </div>

            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-1">Peak Hours</h2>
              <p className="text-[11px] text-gray-600 mb-4">When customers submit requests</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {peakHours.sort((a,b) => b.count - a.count).slice(0,6).map(h => (
                  <div key={h.hour} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-8 flex-shrink-0">{h.hour}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(h.count / maxHourCount) * 100}%`, background: "rgba(96,165,250,0.7)" }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-4">{h.count}</span>
                  </div>
                ))}
              </div>
              {peakHour && <p className="text-[11px] mt-2" style={{ color: "#60a5fa" }}>{peakHour.hour} is your peak hour</p>}
            </div>

            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-1">Key Metrics</h2>
              <p className="text-[11px] text-gray-600 mb-4">All-time averages</p>
              <div className="space-y-3">
                {[
                  { label: "Avg Sale Value", value: `R${avgSaleValue.toFixed(0)}`, color: "#4ade80" },
                  { label: "Avg Profit/Sale", value: sales.length > 0 ? `R${(sales.reduce((s,x) => s+Number(x.profit||0),0)/sales.length).toFixed(0)}` : "—", color: "#60a5fa" },
                  { label: "Conversion Rate", value: `${conversionRate}%`, color: "#fb923c" },
                  { label: "Total Revenue", value: `R${sales.reduce((s,x) => s+Number(x.selling_price||0),0).toFixed(0)}`, color: "#c084fc" },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">{m.label}</span>
                    <span className="font-bold text-[14px]" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MONTHLY TREND */}
          <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
            <h2 className="font-bold text-[14px] text-white mb-1">Monthly Trend</h2>
            <p className="text-[11px] text-gray-600 mb-4">Last 6 months — requests vs sales</p>
            <div className="flex items-end gap-3 h-36">
              {monthlyTrend.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5 h-28">
                    <div className="flex-1 rounded-t-md" style={{ height: `${maxMonthRequests > 0 ? (m.requests / maxMonthRequests) * 100 : 0}%`, background: "rgba(249,115,22,0.4)", minHeight: m.requests > 0 ? 4 : 0 }} />
                    <div className="flex-1 rounded-t-md" style={{ height: `${maxMonthRequests > 0 ? (m.sales / maxMonthRequests) * 100 : 0}%`, background: "rgba(34,197,94,0.6)", minHeight: m.sales > 0 ? 4 : 0 }} />
                  </div>
                  <span className="text-[9px] text-gray-600">{m.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px]">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "rgba(249,115,22,0.6)" }} />Requests</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "rgba(34,197,94,0.6)" }} />Sales</div>
            </div>
          </div>

          {/* SUMMARY ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Total Requests", value: requests.length, color: "#fb923c" },
              { label: "Total Sales", value: sales.length, color: "#4ade80" },
              { label: "All-time Revenue", value: `R${sales.reduce((s, x) => s + Number(x.selling_price || 0), 0).toFixed(0)}`, color: "#4ade80" },
              { label: "All-time Profit", value: `R${allTimeProfit.toFixed(0)}`, color: "#60a5fa" },
              { label: "All-time Expenses", value: `R${allTimeExpenses.toFixed(0)}`, color: "#f87171" },
              { label: "Net Profit", value: `R${netProfit.toFixed(0)}`, color: netProfit >= 0 ? "#4ade80" : "#f87171" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-4" style={cardStyle}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>{item.label}</p>
                <p className="text-[22px] font-black" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
      {/* TARGET MODAL */}
      {targetModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setTargetModal(false); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Set Monthly Target</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{now3.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</p>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Profit Target (R)", key: "profit_target", placeholder: "e.g. 5000" },
                { label: "Revenue Target (R)", key: "revenue_target", placeholder: "e.g. 30000" },
                { label: "Sales Target (count)", key: "sales_target", placeholder: "e.g. 20" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[11px] text-gray-500 mb-1 block">{f.label}</label>
                  <input type="number" placeholder={f.placeholder}
                    value={targetForm[f.key as keyof typeof targetForm]}
                    onChange={e => setTargetForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              ))}
              <p className="text-[11px] text-gray-600">Leave any field blank to skip that target</p>
              <div className="flex gap-2 pt-2">
                <button onClick={saveTarget} disabled={savingTarget}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: savingTarget ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg,#f97316,#ea580c)", border: "none" }}>
                  {savingTarget ? "Saving..." : "Save Target"}
                </button>
                <button onClick={() => setTargetModal(false)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
