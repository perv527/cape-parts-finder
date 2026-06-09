path = "frontend/app/customers/page.tsx"
c = open(path, encoding="utf-8").read()

# Use index-based replacement instead of string matching
i = c.find("convRate}%</div>")
if i < 0:
    print("convRate not found")
else:
    # Find the closing structure after convRate
    # We need to insert after the next 3 closing divs
    pos = i + len("convRate}%</div>")
    
    ltv_stats = '''
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
                          <p className="font-bold text-[14px]" style={{ color: atRisk ? "#f87171" : "white" }}>{daysSinceLastOrder !== null ? String(daysSinceLastOrder) + "d ago" : "Never"}</p>
                        </div>'''
    
    c = c[:pos] + ltv_stats + c[pos:]
    print("Inserted LTV stats!")

open(path, "w", encoding="utf-8").write(c)
print("Done:", "Lifetime Value" in c)
