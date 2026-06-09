path = "frontend/app/suppliers/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add scorecard state
old_state = '  const [requests, setRequests] = useState<any[]>([]);'
new_state = '''  const [requests, setRequests] = useState<any[]>([]);
  const [showScorecards, setShowScorecards] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# 2. Add scorecard button next to Performance button
old_perf_btn = '<button onClick={() => setShowPerformance(!showPerformance)}'
new_perf_btn = '''<button onClick={() => setShowScorecards(!showScorecards)}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition"
            style={{ background: showScorecards ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)", border: showScorecards ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.1)", color: showScorecards ? "#a78bfa" : "rgba(255,255,255,0.7)" }}>
            Scorecards
          </button>
          <button onClick={() => setShowPerformance(!showPerformance)}'''
c = c.replace(old_perf_btn, new_perf_btn, 1)

# 3. Add scorecard section before supplier cards
old_supplier_list = '          {/* SUPPLIER LIST */}'
new_supplier_list = '''          {/* SCORECARDS */}
          {showScorecards && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[16px] text-white">Supplier Scorecards</h2>
                <span className="text-[12px] text-gray-500">Based on all-time performance</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {suppliers.filter(s => s.active !== false).map(supplier => {
                  const stats = getSupplierStats(supplier.id);
                  // Calculate grade
                  let score = 0;
                  if (stats.winRate >= 50) score += 40;
                  else if (stats.winRate >= 30) score += 25;
                  else if (stats.winRate >= 10) score += 10;
                  if (stats.totalQuotes >= 10) score += 30;
                  else if (stats.totalQuotes >= 5) score += 20;
                  else if (stats.totalQuotes >= 1) score += 10;
                  if (stats.avgResponseHrs !== null && stats.avgResponseHrs <= 4) score += 30;
                  else if (stats.avgResponseHrs !== null && stats.avgResponseHrs <= 12) score += 20;
                  else if (stats.avgResponseHrs !== null) score += 5;
                  else score += 15; // no data yet
                  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
                  const gradeColor = grade === "A" ? "#4ade80" : grade === "B" ? "#60a5fa" : grade === "C" ? "#fb923c" : "#f87171";
                  const gradeBg = grade === "A" ? "rgba(74,222,128,0.1)" : grade === "B" ? "rgba(96,165,250,0.1)" : grade === "C" ? "rgba(251,146,60,0.1)" : "rgba(248,113,113,0.1)";
                  return (
                    <div key={supplier.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-[15px] text-white">{supplier.name}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">{supplier.speciality || "General parts"}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3" style={{ background: gradeBg, border: `2px solid ${gradeColor}` }}>
                          <span className="text-[22px] font-black" style={{ color: gradeColor }}>{grade}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: "Quotes", value: stats.totalQuotes },
                          { label: "Win Rate", value: stats.winRate.toFixed(0) + "%" },
                          { label: "Avg Price", value: stats.avgPrice > 0 ? "R" + stats.avgPrice.toFixed(0) : "—" },
                        ].map(m => (
                          <div key={m.label} className="rounded-lg p-2 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <p className="text-[10px] text-gray-600 mb-0.5">{m.label}</p>
                            <p className="text-[14px] font-bold text-white">{m.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-gray-500">Performance score</span>
                          <span style={{ color: gradeColor }}>{score}/100</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, background: gradeColor }} />
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                        {grade === "A" && "Excellent supplier — prioritise for all requests"}
                        {grade === "B" && "Good supplier — reliable choice for most parts"}
                        {grade === "C" && "Average — use when better options unavailable"}
                        {grade === "D" && "Poor performance — consider replacing or discussing issues"}
                        {stats.totalQuotes === 0 && " (No quotes yet — send them requests to build history)"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUPPLIER LIST */}'''
c = c.replace(old_supplier_list, new_supplier_list, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has showScorecards:", "showScorecards" in c)
print("has Scorecards button:", "Scorecards" in c)
print("has grade:", "grade" in c)
