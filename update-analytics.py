path = "frontend/app/analytics/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add expenses state
old_state = '  const [period, setPeriod] = useState<"week" | "month" | "year">("month");'
new_state = '''  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [expenses, setExpenses] = useState<any[]>([]);'''
c = c.replace(old_state, new_state, 1)

# 2. Add expenses fetch to Promise.all
old_fetch = '''      Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: true }),
        supabase.from("parts_requests").select("*").order("created_at", { ascending: false }),
      ]).then(([{ data: s }, { data: r }]) => {
        setSales(s || []);
        setRequests(r || []);
        setAuthChecked(true);
      });'''
new_fetch = '''      Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: true }),
        supabase.from("parts_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").order("date", { ascending: false }),
      ]).then(([{ data: s }, { data: r }, { data: e }]) => {
        setSales(s || []);
        setRequests(r || []);
        setExpenses(e || []);
        setAuthChecked(true);
      });'''
c = c.replace(old_fetch, new_fetch, 1)

# 3. Add expense calculations before statusColors
old_colors = '  const statusColors: Record<string, string> = {'
new_colors = '''  // Expense calculations
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

  const statusColors: Record<string, string> = {'''
c = c.replace(old_colors, new_colors, 1)

# 4. Add expenses cards after KPI CARDS section - replace the 4 KPI cards with 5 including net profit
old_kpi = '''            { label: "Revenue", value: `R${totalRevenue.toFixed(0)}`, sub: `${period}`, color: "#4ade80", glow: "rgba(34,197,94,0.1)" },
              { label: "Profit", value: `R${totalProfit.toFixed(0)}`, sub: `${period}`, color: "#60a5fa", glow: "rgba(59,130,246,0.1)" },
              { label: "Sales", value: totalSalesCount.toString(), sub: `${period}`, color: "#c084fc", glow: "rgba(168,85,247,0.1)" },
              { label: "Conversion", value: `${conversionRate}%`, sub: "requests → sales", color: "#fb923c", glow: "rgba(249,115,22,0.1)" },'''
new_kpi = '''            { label: "Revenue", value: `R${totalRevenue.toFixed(0)}`, sub: `${period}`, color: "#4ade80", glow: "rgba(34,197,94,0.1)" },
              { label: "Profit", value: `R${totalProfit.toFixed(0)}`, sub: `${period}`, color: "#60a5fa", glow: "rgba(59,130,246,0.1)" },
              { label: "Expenses", value: `R${totalExpensesPeriod.toFixed(0)}`, sub: `${period}`, color: "#f87171", glow: "rgba(239,68,68,0.08)" },
              { label: "Net Profit", value: `R${netProfitPeriod.toFixed(0)}`, sub: "after expenses", color: netProfitPeriod >= 0 ? "#4ade80" : "#f87171", glow: netProfitPeriod >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)" },
              { label: "Sales", value: totalSalesCount.toString(), sub: `${period}`, color: "#c084fc", glow: "rgba(168,85,247,0.1)" },
              { label: "Conversion", value: `${conversionRate}%`, sub: "requests → sales", color: "#fb923c", glow: "rgba(249,115,22,0.1)" },'''
c = c.replace(old_kpi, new_kpi, 1)

# 5. Update KPI grid to allow more columns
c = c.replace(
    'className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"',
    'className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6"',
    1
)

# 6. Add expenses summary to the bottom summary row
old_summary = '''              { label: "All-time Revenue", value: `R${sales.reduce((s, x) => s + Number(x.selling_price || 0), 0).toFixed(0)}`, color: "#4ade80" },
              { label: "All-time Profit", value: `R${sales.reduce((s, x) => s + Number(x.profit || 0), 0).toFixed(0)}`, color: "#60a5fa" },'''
new_summary = '''              { label: "All-time Revenue", value: `R${sales.reduce((s, x) => s + Number(x.selling_price || 0), 0).toFixed(0)}`, color: "#4ade80" },
              { label: "All-time Profit", value: `R${allTimeProfit.toFixed(0)}`, color: "#60a5fa" },
              { label: "All-time Expenses", value: `R${allTimeExpenses.toFixed(0)}`, color: "#f87171" },
              { label: "Net Profit", value: `R${netProfit.toFixed(0)}`, color: netProfit >= 0 ? "#4ade80" : "#f87171" },'''
c = c.replace(old_summary, new_summary, 1)

# 7. Update summary grid to 3 cols
c = c.replace(
    'className="grid grid-cols-2 lg:grid-cols-4 gap-3"',
    'className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3"',
    1
)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has expenses state:", "setExpenses" in c)
print("has netProfit:", "netProfit" in c)
print("has totalExpensesPeriod:", "totalExpensesPeriod" in c)
