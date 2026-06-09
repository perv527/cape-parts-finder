path = "frontend/app/customers/page.tsx"
c = open(path, encoding="utf-8").read()

old = 'convRate}%</div>\n                        </div>\n                      </div>\n                   </div>'

new = '''convRate}%</div>
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
                          <p className="font-bold text-[14px]" style={{ color: atRisk ? "#f87171" : "white" }}>
                            {daysSinceLastOrder !== null ? daysSinceLastOrder + "d ago" : "Never"}
                          </p>
                        </div>
                      </div>
                   </div>'''

if old in c:
    c = c.replace(old, new, 1)
    print("Fixed!")
else:
    print("Not found - searching...")
    i = c.find("convRate}%")
    print("convRate at:", i)
    print(repr(c[i:i+200]))

open(path, "w", encoding="utf-8").write(c)
print("Done:", "Lifetime Value" in c)
