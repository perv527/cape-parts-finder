"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Fuel", "Airtime", "Data", "Tools", "Marketing", "Delivery", "Banking", "Other"];
const CAT_COLORS: Record<string, string> = {
  Fuel: "#f97316", Airtime: "#3b82f6", Data: "#8b5cf6",
  Tools: "#14b8a6", Marketing: "#ec4899", Delivery: "#f59e0b",
  Banking: "#22c55e", Other: "#6b7280",
};

const darkBg = { minHeight: "100vh", background: "#0e0e0e", color: "white" };
const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

const NAV_LINKS = [
  { label: "Requests", href: "/admin" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Sales", href: "/sales" }, { label: "Customers", href: "/customers" },
  { label: "Inventory", href: "/inventory" },
  { label: "Analytics", href: "/analytics" },
  { label: "Expenses", href: "/expenses", active: true },
  { label: "Reminders", href: "/reminders" }, { label: "Settings", href: "/settings" },
];

type DateFilter = "week" | "month" | "year" | "all";

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [catFilter, setCatFilter] = useState("All");
  const [form, setForm] = useState({
    category: "Fuel", description: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      await supabase.auth.refreshSession();
      fetchExpenses();
    });
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    const { data } = await supabase.from("expenses").select("*").order("date", { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  }

  async function saveExpense() {
    if (!form.amount || !form.category) { alert("Amount and category are required"); return; }
    setSaving(true);
    const payload = {
      category: form.category,
      description: form.description.trim() || null,
      amount: parseFloat(form.amount),
      date: form.date,
      notes: form.notes.trim() || null,
    };
    if (modal === "add") {
      await supabase.from("expenses").insert([payload]);
    } else {
      await supabase.from("expenses").update(payload).eq("id", modal.id);
    }
    setSaving(false);
    setModal(null);
    fetchExpenses();
  }

  async function deleteExpense(id: number) {
    await supabase.from("expenses").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchExpenses();
  }

  function openAdd() {
    setForm({ category: "Fuel", description: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setModal("add");
  }

  function openEdit(e: any) {
    setForm({ category: e.category, description: e.description || "", amount: String(e.amount), date: e.date, notes: e.notes || "" });
    setModal(e);
  }

  function exportCSV() {
    const headers = ["Date", "Category", "Description", "Amount", "Notes"];
    const rows = filtered.map(e => [e.date, e.category, e.description || "", "R" + Number(e.amount).toFixed(2), e.notes || ""]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "expenses.csv"; a.click();
  }

  const now = new Date();
  const filtered = expenses.filter(e => {
    const d = new Date(e.date);
    if (dateFilter === "week") { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    if (dateFilter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (dateFilter === "year") return d.getFullYear() === now.getFullYear();
    return true;
  }).filter(e => catFilter === "All" || e.category === catFilter);

  const totalSpent = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = CATEGORIES.map(cat => ({
    cat, total: filtered.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + Number(e.amount), 0);

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "white", padding: "8px 12px", width: "100%", outline: "none", fontSize: 13,
  };

  if (loading) return (
    <main style={darkBg} className="flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px" }}>
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-gray-300 text-sm">Loading expenses...</p>
      </div>
    </main>
  );

  return (
    <main style={darkBg}>
      {/* NAV */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-3 h-14 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <span className="font-bold text-white text-[14px] hidden md:block">Cape Parts Finder</span>
          </div>
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide flex-1 mx-1">
            {NAV_LINKS.map(n => (
              <a key={n.href} href={n.href}
                className="px-2.5 py-1.5 rounded-lg text-[11px] no-underline transition font-medium whitespace-nowrap flex-shrink-0"
                style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }}>
                {n.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={exportCSV}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", border: "none" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "This Month", value: "R" + thisMonth.toFixed(0), color: "#f87171" },
            { label: "Period Total", value: "R" + totalSpent.toFixed(0), color: "#fb923c" },
            { label: "Transactions", value: filtered.length, color: "#60a5fa" },
            { label: "Top Category", value: byCategory[0]?.cat || "—", color: CAT_COLORS[byCategory[0]?.cat] || "#6b7280" },
          ].map(s => (
            <div key={s.label} style={cardStyle} className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
              <div className="text-[20px] font-black" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* CATEGORY BREAKDOWN */}
        {byCategory.length > 0 && (
          <div style={cardStyle} className="p-4 mb-4">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Breakdown by Category</div>
            <div className="space-y-2">
              {byCategory.map(c => (
                <div key={c.cat} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[c.cat] || "#6b7280" }} />
                  <span className="text-[12px] text-gray-300 w-24 flex-shrink-0">{c.cat}</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", height: 6 }}>
                    <div className="h-full rounded-full" style={{ width: totalSpent > 0 ? `${(c.total / totalSpent) * 100}%` : "0%", background: CAT_COLORS[c.cat] || "#6b7280", transition: "width 0.5s" }} />
                  </div>
                  <span className="text-[12px] font-bold text-white w-20 text-right">R{c.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div style={cardStyle} className="p-4 mb-4">
          <div className="flex gap-2 flex-wrap mb-3">
            {(["week", "month", "year", "all"] as DateFilter[]).map(f => (
              <button key={f} onClick={() => setDateFilter(f)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition capitalize"
                style={dateFilter === f
                  ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                {f === "week" ? "This Week" : f === "month" ? "This Month" : f === "year" ? "This Year" : "All Time"}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {["All", ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer transition whitespace-nowrap flex-shrink-0"
                style={catFilter === cat
                  ? { background: `${CAT_COLORS[cat] || "rgba(249,115,22,0.15)"}22`, border: `1px solid ${CAT_COLORS[cat] || "#fb923c"}55`, color: CAT_COLORS[cat] || "#fb923c" }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* EXPENSE LIST */}
        {filtered.length === 0 ? (
          <div style={cardStyle} className="p-12 text-center">
            <div className="text-4xl mb-3">💸</div>
            <div className="text-white font-semibold mb-1">No expenses yet</div>
            <div className="text-gray-500 text-[13px]">Click "Add" to start tracking your business costs</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(e => (
              <div key={e.id} style={cardStyle} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${CAT_COLORS[e.category] || "#6b7280"}20`, border: `1px solid ${CAT_COLORS[e.category] || "#6b7280"}40` }}>
                  <span className="text-[16px]">
                    {e.category === "Fuel" ? "⛽" : e.category === "Airtime" ? "📱" : e.category === "Data" ? "📶" :
                     e.category === "Tools" ? "🔧" : e.category === "Marketing" ? "📢" : e.category === "Delivery" ? "🚚" :
                     e.category === "Banking" ? "🏦" : "💰"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[13px] text-white">{e.category}</span>
                    {e.description && <span className="text-[12px] text-gray-500 truncate">{e.description}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-600">{new Date(e.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {e.notes && <span className="text-[11px] text-gray-700 truncate">· {e.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-black text-[18px]" style={{ color: "#f87171" }}>R{Number(e.amount).toFixed(2)}</span>
                  <button onClick={() => openEdit(e)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(e)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {modal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">{modal === "add" ? "Add Expense" : "Edit Expense"}</h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Category</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#1a1a1a" }}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Amount (R) *</label>
                <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Date</label>
                <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Description</label>
                <input style={inputStyle} placeholder="e.g. Fill up at Engen" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Notes</label>
                <textarea style={{ ...inputStyle, resize: "none", height: 60 }} placeholder="Any extra notes..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveExpense} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: saving ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg,#f97316,#ea580c)", border: "none" }}>
                  {saving ? "Saving..." : modal === "add" ? "Add Expense" : "Save Changes"}
                </button>
                <button onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5">
              <h2 className="font-bold text-[15px] text-white mb-1">Delete Expense?</h2>
              <p className="text-[13px] text-gray-400">Remove <span style={{ color: "#fb923c" }}>{deleteConfirm.category} — R{Number(deleteConfirm.amount).toFixed(2)}</span> from {deleteConfirm.date}?</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => deleteExpense(deleteConfirm.id)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer text-white"
                  style={{ background: "rgba(239,68,68,0.8)", border: "none" }}>Delete</button>
                <button onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
