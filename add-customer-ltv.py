path = "frontend/app/customers/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add LTV tier calculation inside customers.map
old_map = '''              const isVip = c.sales.length >= 3;
              const isRepeat = c.sales.length >= 2;
              const convRate = c.requests.length > 0 ? ((c.sales.length / c.requests.length) * 100).toFixed(0) : "0";'''

new_map = '''              const isVip = c.sales.length >= 3;
              const isRepeat = c.sales.length >= 2;
              const convRate = c.requests.length > 0 ? ((c.sales.length / c.requests.length) * 100).toFixed(0) : "0";

              // LTV calculations
              const ltv = c.totalSpend || 0;
              const tier = ltv >= 5000 ? "Platinum" : ltv >= 2000 ? "Gold" : ltv >= 500 ? "Silver" : "Bronze";
              const tierColor = tier === "Platinum" ? "#e2e8f0" : tier === "Gold" ? "#fbbf24" : tier === "Silver" ? "#94a3b8" : "#cd7f32";
              const tierBg = tier === "Platinum" ? "rgba(226,232,240,0.1)" : tier === "Gold" ? "rgba(251,191,36,0.1)" : tier === "Silver" ? "rgba(148,163,184,0.1)" : "rgba(205,127,50,0.1)";
              const daysSinceLastOrder = c.sales.length > 0
                ? Math.floor((Date.now() - new Date(c.sales[c.sales.length-1].created_at).getTime()) / (1000*60*60*24))
                : null;
              const atRisk = daysSinceLastOrder !== null && daysSinceLastOrder > 60 && c.sales.length > 0;
              const avgOrderValue = c.sales.length > 0 ? (ltv / c.sales.length).toFixed(0) : "0";
              // Predict next order based on average gap
              let predictedNext = null;
              if (c.sales.length >= 2) {
                const gaps: number[] = [];
                for (let gi = 1; gi < c.sales.length; gi++) {
                  gaps.push((new Date(c.sales[gi].created_at).getTime() - new Date(c.sales[gi-1].created_at).getTime()) / (1000*60*60*24));
                }
                const avgGap = gaps.reduce((a,b) => a+b, 0) / gaps.length;
                const lastOrderDate = new Date(c.sales[c.sales.length-1].created_at);
                predictedNext = new Date(lastOrderDate.getTime() + avgGap * 24*60*60*1000);
              }'''
c = c.replace(old_map, new_map, 1)

# 2. Add LTV badge next to VIP badge
old_vip = '              const isVip = c.sales.length >= 3;'
# Already replaced above, now find the badge display
old_badge = '{isVip && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>VIP</span>}'
new_badge = '''{isVip && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>VIP</span>}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tierBg, color: tierColor }}>{tier}</span>
                      {atRisk && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>At Risk</span>}'''
c = c.replace(old_badge, new_badge, 1)

# 3. Add LTV stats to expanded card
old_conv = '''<p className="text-[10px] text-gray-500 mb-0.5">Conv. Rate</p>
                          <p className="font-bold text-white text-[14px]">{convRate}%</p>'''
new_conv = '''<p className="text-[10px] text-gray-500 mb-0.5">Conv. Rate</p>
                          <p className="font-bold text-white text-[14px]">{convRate}%</p>
                        </div>
                        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p className="text-[10px] text-gray-500 mb-0.5">Lifetime Value</p>
                          <p className="font-bold text-[14px]" style={{ color: tierColor }}>R{ltv.toFixed(0)}</p>
                        </div>
                        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p className="text-[10px] text-gray-500 mb-0.5">Avg Order</p>
                          <p className="font-bold text-white text-[14px]">R{avgOrderValue}</p>
                        </div>
                        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p className="text-[10px] text-gray-500 mb-0.5">Last Order</p>
                          <p className="font-bold text-[14px]" style={{ color: atRisk ? "#f87171" : "white" }}>{daysSinceLastOrder !== null ? daysSinceLastOrder + "d ago" : "—"}</p>'''
c = c.replace(old_conv, new_conv, 1)

# 4. Add predicted next order if available
old_whatsapp_btn = '{c.phone !== "unknown" && ('
new_whatsapp_btn = '''{predictedNext && (
                        <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
                          <p className="text-[11px] text-gray-400">
                            Predicted next order: <span className="font-semibold text-white">{predictedNext.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
                            {atRisk && <span className="text-[11px] text-red-400 ml-2">— overdue, consider following up</span>}
                          </p>
                        </div>
                      )}
                      {c.phone !== "unknown" && ('''
c = c.replace(old_whatsapp_btn, new_whatsapp_btn, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has tier:", "Platinum" in c)
print("has atRisk:", "atRisk" in c)
print("has predictedNext:", "predictedNext" in c)
print("has LTV:", "Lifetime Value" in c)
