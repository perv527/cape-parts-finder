path = "frontend/app/analytics/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add targets state
old_state = '  const [expenses, setExpenses] = useState<any[]>([]);'
new_state = '''  const [expenses, setExpenses] = useState<any[]>([]);
  const [target, setTarget] = useState<any>(null);
  const [targetModal, setTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState({ profit_target: "", revenue_target: "", sales_target: "" });
  const [savingTarget, setSavingTarget] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# 2. Add targets fetch to Promise.all
old_fetch = '''      Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: true }),
        supabase.from("parts_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").order("date", { ascending: false }),
      ]).then(([{ data: s }, { data: r }, { data: e }]) => {
        setSales(s || []);
        setRequests(r || []);
        setExpenses(e || []);
        setAuthChecked(true);
      });'''
new_fetch = '''      const now = new Date();
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
      });'''
c = c.replace(old_fetch, new_fetch, 1)

# 3. Add saveTarget function before statusColors
old_colors = '  // Expense calculations'
new_colors = '''  async function saveTarget() {
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

  // Expense calculations'''
c = c.replace(old_colors, new_colors, 1)

# 4. Add target progress calculations after expense calculations
old_net = '  const statusColors: Record<string, string> = {'
new_net = '''  // Target progress
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

  const statusColors: Record<string, string> = {'''
c = c.replace(old_net, new_net, 1)

# 5. Add target section after TODAY'S SUMMARY and before Analytics heading
old_heading = '          <div className="mb-6">\n            <h1 className="text-[22px] font-black text-white tracking-tight">Analytics</h1>'
new_heading = '''          {/* MONTHLY TARGETS */}
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
            <h1 className="text-[22px] font-black text-white tracking-tight">Analytics</h1>'''
c = c.replace(old_heading, new_heading, 1)

# 6. Add target modal before closing </main>
old_closing = '\n    </main>\n  );\n}'
new_closing = '''
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
}'''
c = c.replace(old_closing, new_closing, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has target state:", "setTarget" in c)
print("has saveTarget:", "saveTarget" in c)
print("has target modal:", "targetModal" in c)
print("has progress bar:", "profitPct" in c)
