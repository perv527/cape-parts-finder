path = "frontend/app/suppliers/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add quotes state
old_state = '  const [suppliers, setSuppliers] = useState<any[]>([]);'
new_state = '''  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [showPerf, setShowPerf] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# 2. Add quotes + sales fetch
old_fetch = 'supabase.from("suppliers").select'
# Find the fetchData or useEffect area
old_supabase = '    const { data, error } = await supabase.from("suppliers").select("*").order("name");'
new_supabase = '''    const { data, error } = await supabase.from("suppliers").select("*").order("name");
    const [{ data: q }, { data: s }] = await Promise.all([
      supabase.from("supplier_quotes").select("*").order("created_at", { ascending: false }),
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
    ]);
    setQuotes(q || []);
    setSales(s || []);'''
c = c.replace(old_supabase, new_supabase, 1)

# 3. Add performance calculation function before the return statement
old_return = '  return ('
new_return = '''  function getSupplierStats(supplierId: number) {
    const supplierQuotes = quotes.filter((q: any) => q.supplier_id === supplierId);
    const wonSales = sales.filter((s: any) =>
      supplierQuotes.some((q: any) => q.request_id === s.request_id)
    );
    const avgPrice = supplierQuotes.length > 0
      ? supplierQuotes.reduce((sum: number, q: any) => sum + Number(q.supplier_price || 0), 0) / supplierQuotes.length
      : 0;
    const winRate = supplierQuotes.length > 0
      ? ((wonSales.length / supplierQuotes.length) * 100).toFixed(0)
      : "0";
    return {
      totalQuotes: supplierQuotes.length,
      wonSales: wonSales.length,
      avgPrice,
      winRate,
      score: supplierQuotes.length * 2 + wonSales.length * 5,
    };
  }

  const supplierStats = suppliers.map(s => ({ ...s, stats: getSupplierStats(s.id) }))
    .sort((a, b) => b.stats.score - a.stats.score);

  const topSupplier = supplierStats[0];

  return ('''
c = c.replace(old_return, new_return, 1)

# 4. Add performance button to nav area - find the refresh button
old_refresh = '              <button onClick={fetchData} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition"'
new_refresh = '''              <button onClick={() => setShowPerf(!showPerf)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={showPerf
                  ? { background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                📊 Performance
              </button>
              <button onClick={fetchData} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition"'''
c = c.replace(old_refresh, new_refresh, 1)

# 5. Add performance section after the stats cards and before supplier list
# Find a good insertion point - after the stats grid
old_section = '          {/* SUPPLIER CARDS */'
new_section = '''          {/* PERFORMANCE REPORT */}
          {showPerf && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-[15px] text-white">Supplier Performance Report</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Based on quotes given and sales converted</p>
                </div>
                {topSupplier && topSupplier.stats.totalQuotes > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 mb-0.5">Top Performer</div>
                    <div className="font-bold text-[13px]" style={{ color: "#fbbf24" }}>🏆 {topSupplier.name}</div>
                  </div>
                )}
              </div>
              {supplierStats.filter(s => s.stats.totalQuotes > 0).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 text-[13px]">No quote data yet — performance will show once suppliers start quoting</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supplierStats.filter(s => s.stats.totalQuotes > 0).map((s, idx) => (
                    <div key={s.id} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: idx === 0 ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px]">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx+1}`}</span>
                          <span className="font-bold text-white text-[14px]">{s.name}</span>
                          {s.active ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>Active</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280", border: "1px solid rgba(107,114,128,0.2)" }}>Inactive</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-black text-[18px]" style={{ color: Number(s.stats.winRate) >= 50 ? "#4ade80" : Number(s.stats.winRate) >= 25 ? "#fb923c" : "#f87171" }}>{s.stats.winRate}%</div>
                          <div className="text-[10px] text-gray-600">win rate</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Quotes Given", value: s.stats.totalQuotes, color: "#60a5fa" },
                          { label: "Sales Won", value: s.stats.wonSales, color: "#4ade80" },
                          { label: "Avg Price", value: s.stats.avgPrice > 0 ? "R" + s.stats.avgPrice.toFixed(0) : "—", color: "#fb923c" },
                        ].map(stat => (
                          <div key={stat.label} className="text-center rounded-lg py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="font-bold text-[16px]" style={{ color: stat.color }}>{stat.value}</div>
                            <div className="text-[10px] text-gray-600">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1">
                          <span>Performance score</span>
                          <span>{s.stats.score} pts</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all" style={{
                            width: supplierStats[0].stats.score > 0 ? `${(s.stats.score / supplierStats[0].stats.score) * 100}%` : "0%",
                            background: idx === 0 ? "linear-gradient(90deg,#fbbf24,#f59e0b)" : idx === 1 ? "linear-gradient(90deg,#d1d5db,#9ca3af)" : "linear-gradient(90deg,#fb923c,#f97316)"
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUPPLIER CARDS */'''
c = c.replace(old_section, new_section, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has getSupplierStats:", "getSupplierStats" in c)
print("has showPerf:", "showPerf" in c)
print("has Performance button:", "Performance" in c)
