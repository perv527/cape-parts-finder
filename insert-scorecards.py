path = "frontend/app/suppliers/page.tsx"
c = open(path, encoding="utf-8").read()

# Find the exact insertion point - before supplierStats.filter
i = c.find("              {supplierStats.filter(s => s.stats.totalQuotes > 0)")
print("insertion point at:", i)

scorecard_ui = '''              {/* SCORECARDS */}
              {showScorecards && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-[16px] text-white">Supplier Scorecards</h2>
                    <span className="text-[12px] text-gray-500">Based on all-time data</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {supplierStats.map(s => {
                      const stats = s.stats;
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
                      else score += 15;
                      const grade = stats.totalQuotes === 0 ? "N" : score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
                      const gradeColor = grade === "N" ? "#9ca3af" : grade === "A" ? "#4ade80" : grade === "B" ? "#60a5fa" : grade === "C" ? "#fb923c" : "#f87171";
                      const gradeBg = grade === "N" ? "rgba(156,163,175,0.08)" : grade === "A" ? "rgba(74,222,128,0.08)" : grade === "B" ? "rgba(96,165,250,0.08)" : grade === "C" ? "rgba(251,146,60,0.08)" : "rgba(248,113,113,0.08)";
                      return (
                        <div key={s.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-[15px] text-white">{s.name}</h3>
                              <p className="text-[11px] text-gray-500 mt-0.5">{s.speciality || "General parts"}</p>
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
                          <div className="mb-2">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-gray-500">Score</span>
                              <span style={{ color: gradeColor }}>{grade === "N" ? "No data" : score + "/100"}</span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-1.5 rounded-full" style={{ width: `${grade === "N" ? 0 : score}%`, background: gradeColor }} />
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-600">
                            {grade === "N" && "New — send requests to start tracking"}
                            {grade === "A" && "Excellent — prioritise for all requests"}
                            {grade === "B" && "Good — reliable for most parts"}
                            {grade === "C" && "Average — use when better options unavailable"}
                            {grade === "D" && "Poor — consider replacing or discussing issues"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              '''

if i > 0:
    c = c[:i] + scorecard_ui + c[i:]
    print("Inserted scorecard UI!")
else:
    print("Insertion point not found")

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has grade A:", "grade === \"A\"" in c)
